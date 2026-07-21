import { create } from 'zustand'
import { useEditor } from './editorStore'
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
  autoSaveTimer: number | null
  startAutoSave: (projectId: string) => void
  stopAutoSave: () => void
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

export const useVersionStore = create<VersionState>((set, get) => ({
  autoSaveTimer: null,

  startAutoSave(projectId) {
    get().stopAutoSave()
    const timer = window.setInterval(() => {
      const s = useEditor.getState()
      get().saveSnapshot(projectId, s.elements, s.background)
    }, 5 * 60 * 1000)
    set({ autoSaveTimer: timer })
  },

  stopAutoSave() {
    const { autoSaveTimer } = get()
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      set({ autoSaveTimer: null })
    }
  },

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
    const id = uid()
    const record: SnapshotRecord = {
      id,
      projectId,
      timestamp: Date.now(),
      elements,
      background,
    }
    await tx(STORE_NAME, 'readwrite', (s) => s.put(record))
  },

  async restoreSnapshot(id) {
    if (typeof indexedDB === 'undefined') return null
    try {
      const record = await tx<SnapshotRecord | undefined>(STORE_NAME, 'readonly', (s) => s.get(id))
      if (!record) return null
      return { elements: record.elements, background: record.background }
    } catch {
      return null
    }
  },

  async deleteSnapshot(id) {
    if (typeof indexedDB === 'undefined') return
    await tx(STORE_NAME, 'readwrite', (s) => s.delete(id))
  },
}))
