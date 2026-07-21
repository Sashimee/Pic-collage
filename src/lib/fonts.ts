// Client-side font management via FontFace API.
// Fonts are loaded from user-uploaded files and cached in IndexedDB.

const FONT_STORE = 'custom-fonts'
const DB_NAME = 'pic-collage-fonts'
const DB_VERSION = 1

interface CustomFont {
  id: string
  name: string
  family: string
  blob: Blob
  format: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openFontDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(FONT_STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function loadCustomFonts(): Promise<CustomFont[]> {
  const db = await openFontDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, 'readonly')
    const store = tx.objectStore(FONT_STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as CustomFont[])
    req.onerror = () => reject(req.error)
  })
}

export async function saveCustomFont(name: string, blob: Blob): Promise<CustomFont> {
  const format = blob.type || 'font/ttf'
  const ext = format.includes('woff2') ? 'woff2' : format.includes('woff') ? 'woff' : 'ttf'
  const id = `font-${Date.now()}`
  const family = `${name.replace(/\s+/g, '-')}-${id.slice(-4)}`
  const font: CustomFont = { id, name, family, blob, format: ext }

  const db = await openFontDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, 'readwrite')
    const store = tx.objectStore(FONT_STORE)
    const req = store.put(font)
    req.onsuccess = () => resolve(undefined)
    req.onerror = () => reject(req.error)
  })

  // Register with FontFace API
  const url = URL.createObjectURL(blob)
  const face = new FontFace(family, `url(${url})`, { display: 'swap' })
  await face.load()
  document.fonts.add(face)

  return font
}

export async function deleteCustomFont(id: string): Promise<void> {
  const db = await openFontDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(FONT_STORE, 'readwrite')
    const store = tx.objectStore(FONT_STORE)
    const req = store.delete(id)
    req.onsuccess = () => resolve(undefined)
    req.onerror = () => reject(req.error)
  })
}

/** Restore all saved custom fonts on app startup. */
export async function restoreCustomFonts(): Promise<string[]> {
  const fonts = await loadCustomFonts()
  const loaded: string[] = []
  for (const f of fonts) {
    try {
      const url = URL.createObjectURL(f.blob)
      const face = new FontFace(f.family, `url(${url})`, { display: 'swap' })
      await face.load()
      document.fonts.add(face)
      loaded.push(f.family)
    } catch {
      // Skip corrupted fonts
    }
  }
  return loaded
}
