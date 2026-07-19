// Portable .piccollage file format — a single JSON blob with embedded base64 photos.
// This keeps the format dependency-free and human-readable (unlike binary zip).

import type { LoadedDocument } from '../store/editorStore'
import { getPhoto, putPhoto } from './persistence'

export interface PicCollageFile {
  version: 1
  project: {
    name: string
    createdAt: number
    updatedAt: number
  }
  doc: LoadedDocument
  photos: Record<string, string> // photoId → base64 data URL
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function packProject(
  name: string,
  doc: LoadedDocument,
): Promise<Blob> {
  // Collect all photoIds referenced in the document
  const photoIds = new Set<string>()
  for (const el of doc.elements) {
    if (el.type === 'photo' && el.photoId) {
      photoIds.add(el.photoId)
    }
  }
  const bg = doc.background as any
  if (bg.type === 'photo' && bg.photoId) {
    photoIds.add(bg.photoId)
  }

  // Fetch blobs from IndexedDB and encode
  const photos: Record<string, string> = {}
  for (const id of photoIds) {
    const blob = await getPhoto(id)
    if (blob) {
      photos[id] = await blobToBase64(blob)
    }
  }

  const file: PicCollageFile = {
    version: 1,
    project: {
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    doc,
    photos,
  }

  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

export async function unpackProject(
  blob: Blob,
): Promise<{ name: string; doc: LoadedDocument }> {
  const text = await blob.text()
  const file = JSON.parse(text) as PicCollageFile

  if (file.version !== 1) {
    throw new Error(`Unsupported .piccollage version: ${file.version}`)
  }

  // Decode base64 photos and store back into IndexedDB
  for (const [photoId, dataUrl] of Object.entries(file.photos)) {
    const response = await fetch(dataUrl)
    const photoBlob = await response.blob()
    await putPhoto(photoId, photoBlob)
  }

  return { name: file.project.name, doc: file.doc }
}
