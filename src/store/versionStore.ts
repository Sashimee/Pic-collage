import { create } from 'zustand'
import { rehydratePhotos, stripPhotoUrls } from '../lib/photoRehydrate'
import type { CanvasElement, Background } from '../types'

const DB_NAME = 'piccollage-snapshots'
const DB_VERSION = 1
const STORE_NAME = 'snapshots'

interface SnapshotRecord {
  id: string
  projectId: string
  timestamp: number
  elements: CanvasElement[]
  background: Background
}

export interface SnapshotMeta {
  id: string
  timestamp: number
  elementCount: number
}

interface VersionState {
  getSnapshots: (projectId: string) => Promise<SnapshotMeta[]>
  saveSnapshot: (projectId: string, elements: CanvasElement[], background: Background) => Promise<void>
  restoreSnapshot: (id: string) => Promise<{ elements: CanvasElement[]; background: Background } | null>
  deleteSnapshot: (id: string) => Promise<void>
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('projectId', 'projectId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = run(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

/** Retained versions per project. Snapshots inline their photos, so this is a
 *  storage bound as much as a UI one. */
export const MAX_SNAPSHOTS = 20

/**
 * Strictly increasing timestamps. Two saves inside the same millisecond would
 * otherwise tie, and both the "is this newer than the last snapshot" dedupe and
 * the newest-first ordering would then depend on IndexedDB's arbitrary key
 * order. Stays a plain epoch number, so existing records and the UI's date
 * formatting are unaffected.
 */
let lastTimestamp = 0
function nextTimestamp() {
  lastTimestamp = Math.max(Date.now(), lastTimestamp + 1)
  return lastTimestamp
}

function allFor(projectId: string): Promise<SnapshotRecord[]> {
  return openDB().then(
    (db) =>
      new Promise<SnapshotRecord[]>((resolve, reject) => {
        const t = db.transaction(STORE_NAME, 'readonly')
        const req = t.objectStore(STORE_NAME).index('projectId').getAll(projectId)
        req.onsuccess = () => resolve(req.result as SnapshotRecord[])
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

/** Cheap structural fingerprint — enough to tell "nothing changed" from a real
 *  edit without deep-diffing every element. */
function fingerprint(elements: CanvasElement[], background: Background): string {
  return JSON.stringify(elements) + '|' + JSON.stringify(background)
}

/**
 * Fingerprint of the newest snapshot per project. The autosave fires on a 1.5s
 * debounce, so without this every idle pause during editing would read back the
 * project's entire snapshot index just to conclude nothing had changed.
 * Memory-only: a cold start simply falls through to the IndexedDB check once.
 */
const lastFingerprint = new Map<string, string>()

export const useVersionStore = create<VersionState>(() => ({
  async getSnapshots(projectId) {
    if (typeof indexedDB === 'undefined') return []
    try {
      const db = await openDB()
      const t = db.transaction(STORE_NAME, 'readonly')
      const store = t.objectStore(STORE_NAME)
      const index = store.index('projectId')
      const req = index.getAll(projectId)
      const records: SnapshotRecord[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as SnapshotRecord[])
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      })
      return records
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          elementCount: r.elements?.length ?? 0,
        }))
    } catch {
      return []
    }
  },

  async saveSnapshot(projectId, elements, background) {
    if (typeof indexedDB === 'undefined') return
    try {
      // Compare in *stored* form. Records hold stripped elements, so comparing
      // them against live ones — which still carry blob: URLs — would differ
      // every time and defeat the de-duplication below.
      const stored = stripPhotoUrls(elements)
      const print = fingerprint(stored, background)

      // Fast path: we already know this document is the newest snapshot, so
      // there is nothing to write and no need to touch IndexedDB at all.
      if (lastFingerprint.get(projectId) === print) return

      const existing = await allFor(projectId)

      // The autosave fires on a 1.5s debounce during ordinary editing. Without
      // this guard every pause would mint a near-identical history entry and
      // bury the ones that mean something.
      const newest = existing.reduce<SnapshotRecord | null>(
        (best, r) => (!best || r.timestamp > best.timestamp ? r : best),
        null,
      )
      if (newest && fingerprint(newest.elements, newest.background) === print) {
        lastFingerprint.set(projectId, print)
        return
      }

      const record: SnapshotRecord = {
        id: uid(),
        projectId,
        timestamp: nextTimestamp(),
        // Object URLs die with the document; store photoIds and rebuild on
        // restore, or a version restored after a reload has no photos.
        elements: stored,
        background,
      }
      await tx(STORE_NAME, 'readwrite', (s) => s.put(record))
      lastFingerprint.set(projectId, print)

      // Photos are inlined in `elements`, so unbounded history would grow
      // IndexedDB without limit. Keep the most recent MAX_SNAPSHOTS.
      const stale = [...existing, record]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(MAX_SNAPSHOTS)
      for (const r of stale) {
        await tx(STORE_NAME, 'readwrite', (s) => s.delete(r.id))
      }
    } catch {
      // History is a convenience; never let it break a save.
    }
  },

  async restoreSnapshot(id) {
    if (typeof indexedDB === 'undefined') return null
    try {
      const record = await tx<SnapshotRecord | undefined>(STORE_NAME, 'readonly', (s) => s.get(id))
      if (!record) return null
      return {
        elements: await rehydratePhotos(record.elements),
        background: record.background,
      }
    } catch {
      return null
    }
  },

  async deleteSnapshot(id) {
    if (typeof indexedDB === 'undefined') return
    await tx(STORE_NAME, 'readwrite', (s) => s.delete(id))
    // The deleted record may have been the newest one the cache is standing in
    // for; keeping it would silently skip the save that should replace it.
    lastFingerprint.clear()
  },
}))

// Dev-only test seam; see the note in projectsStore.
if (import.meta.env.DEV) {
  ;(window as unknown as { __versions?: typeof useVersionStore }).__versions = useVersionStore
}
