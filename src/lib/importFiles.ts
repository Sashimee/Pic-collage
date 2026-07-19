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
  console.log('[importFiles] processing', files.length, 'files')
  for (const file of Array.from(files)) {
    // Mobile Safari often reports empty or 'application/octet-stream' for
    // Camera Roll photos. We try to load any file that is not a known non-image
    // type; loadPhotoMeta will fail gracefully on actually broken files.
    if (file.type && file.type !== 'application/octet-stream' && !file.type.startsWith('image/')) {
      console.log('[importFiles] skipping non-image type:', file.type, file.name)
      continue
    }
    try {
      const meta = await loadPhotoMeta(file)
      const photoId = uid()
      console.log('[importFiles] loaded', meta.width, 'x', meta.height, 'photoId', photoId, 'src', meta.src.slice(0, 40))
      void putPhoto(photoId, meta.blob)
      add(meta.src, meta.width, meta.height, photoId)
    } catch (err) {
      console.error('[importFiles] failed to process file:', file.name, err)
    }
  }
}
