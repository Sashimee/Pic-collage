import { loadPhotoMeta } from './importPhotos'
import { putPhoto } from './persistence'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// Decode picked image files, stash each source blob in IndexedDB (so the
// collage survives a reload), and hand the object URL + intrinsic size to the
// store's addPhoto. Shared by the Photos panel and the first-run empty state.
export async function importFiles(
  files: FileList,
  add: (src: string, w: number, h: number, photoId?: string) => void,
) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    try {
      const meta = await loadPhotoMeta(file)
      const photoId = uid()
      void putPhoto(photoId, meta.blob)
      add(meta.src, meta.width, meta.height, photoId)
    } catch {
      /* skip undecodable files */
    }
  }
}
