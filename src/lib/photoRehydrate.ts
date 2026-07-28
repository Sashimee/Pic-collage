import { getPhoto } from './persistence'
import type { Background, CanvasElement } from '../types'

/*
 * Photo elements carry their pixels as `blob:` object URLs, which are handles
 * into the *current document* and die the moment the page reloads. The bytes
 * themselves live in IndexedDB, keyed by `photoId` (see importPhotos.ts, which
 * writes `<id>:orig`, `<id>:prev` and `<id>:thumb`).
 *
 * So anything that persists a document has to strip those URLs on the way in
 * and rebuild them on the way out. App.tsx's own autosave always did this;
 * saved projects and version-history snapshots did not, which is why reopening
 * either one after a restart showed a collage with its photos missing.
 */

/** Drop transient object URLs, keeping `photoId` so the blobs can be found again. */
export function stripPhotoUrls(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((el) =>
    el.type === 'photo'
      ? { ...el, src: '', previewSrc: undefined, originalSrc: undefined, thumbSrc: undefined }
      : el,
  )
}

/**
 * Rebuild object URLs from the stored blobs. Photos whose blobs are gone are
 * dropped rather than left as broken elements — a missing photo should not take
 * the rest of the collage down with it.
 *
 * One URL is minted per photo per call, so callers own revoking them; the app
 * already revokes on unload and when elements are removed.
 */
export async function rehydratePhotos(elements: CanvasElement[]): Promise<CanvasElement[]> {
  const out: CanvasElement[] = []
  for (const el of elements) {
    if (el.type !== 'photo') {
      out.push(el)
      continue
    }
    // Already live (same-session restore): nothing to rebuild.
    if (el.src?.startsWith('blob:')) {
      out.push(el)
      continue
    }
    if (!el.photoId) continue

    const [origBlob, prevBlob, thumbBlob] = await Promise.all([
      getPhoto(`${el.photoId}:orig`).catch(() => undefined),
      getPhoto(`${el.photoId}:prev`).catch(() => undefined),
      getPhoto(`${el.photoId}:thumb`).catch(() => undefined),
    ])
    // The preview is what the canvas draws; without it there is nothing to show.
    if (!prevBlob) continue

    const previewSrc = URL.createObjectURL(prevBlob)
    out.push({
      ...el,
      src: previewSrc,
      previewSrc,
      originalSrc: origBlob ? URL.createObjectURL(origBlob) : undefined,
      thumbSrc: thumbBlob ? URL.createObjectURL(thumbBlob) : undefined,
    })
  }
  return out
}

/*
 * The board *background* can be a photo too, and it was missed. It is not a
 * CanvasElement, so neither helper above ever touched it: its `blob:` URL was
 * persisted verbatim and dead on the next load, which is exactly the failure
 * these functions exist to prevent.
 */

/** IndexedDB key for a background photo's bytes. */
export const backgroundKey = (photoId: string) => `${photoId}:bg`

/** Drop the transient URL, keeping `photoId` so the bytes can be found again. */
export function stripBackgroundUrl(bg: Background): Background {
  return bg.photoSrc ? { ...bg, photoSrc: undefined } : bg
}

/**
 * Rebuild the background's object URL from its stored blob.
 *
 * A background whose blob is gone falls back to the flat colour rather than
 * leaving a broken image — the same choice `rehydratePhotos` makes for photos.
 */
export async function rehydrateBackground(bg: Background): Promise<Background> {
  if (bg.type !== 'photo' || !bg.photoId) return bg
  // Already live (same-session restore): nothing to rebuild.
  if (bg.photoSrc?.startsWith('blob:')) return bg
  const blob = await getPhoto(backgroundKey(bg.photoId)).catch(() => undefined)
  if (!blob) return { ...bg, photoSrc: undefined }
  return { ...bg, photoSrc: URL.createObjectURL(blob) }
}
