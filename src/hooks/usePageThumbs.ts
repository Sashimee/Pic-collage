import { useEffect, useRef, useState } from 'react'
import type { PhotoElement } from '../types'
import type { LoadedDocument } from '../store/editorStore'
import { getPhoto } from '../lib/persistence'
import { previewPhotos } from '../lib/pagePreview'

/**
 * Resolve a picture for every photo the page strip wants to draw.
 *
 * Stored pages hold no object URLs at all: `getSnapshot()` runs
 * `stripPhotoUrls()` before a page is written, because a `blob:` URL is a
 * handle into the current document and dies on reload. So every page except
 * the one being edited has to be read back out of IndexedDB — the 256px
 * `:thumb` variant, which exists precisely for this.
 *
 * The URLs are minted here, so they are revoked here. One leak per page per
 * render would be a real memory problem on a phone.
 */
export function usePageThumbs(pages: LoadedDocument[], max = 6) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  // Everything this hook created, so unmount can revoke all of it — including
  // entries already dropped from state.
  const created = useRef<Map<string, string>>(new Map())

  // Which photos are actually drawn, in a stable form the effect can compare.
  const wanted = pages
    .flatMap((p) => previewPhotos(p, max))
    .map((pp) => pp.el)
    .filter((el) => !el.src?.startsWith('blob:') && el.photoId)
    .map((el) => el.photoId!)
  const key = Array.from(new Set(wanted)).sort().join(',')

  useEffect(() => {
    let cancelled = false
    const ids = key ? key.split(',') : []
    const missing = ids.filter((id) => !created.current.has(id))
    if (!missing.length) return

    void (async () => {
      const added: Record<string, string> = {}
      for (const id of missing) {
        const blob = await getPhoto(`${id}:thumb`).catch(() => undefined)
        if (cancelled) {
          // Revoke anything minted after the component went away.
          for (const url of Object.values(added)) URL.revokeObjectURL(url)
          return
        }
        if (!blob) continue
        const url = URL.createObjectURL(blob)
        created.current.set(id, url)
        added[id] = url
      }
      if (Object.keys(added).length) setUrls((prev) => ({ ...prev, ...added }))
    })()

    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(
    () => () => {
      for (const url of created.current.values()) URL.revokeObjectURL(url)
      created.current.clear()
    },
    [],
  )

  /**
   * Live elements already carry a thumb; stored ones come from IndexedDB.
   * Note `??` would be wrong here: a stripped element's `src` is `''`, which is
   * not nullish, so it would win and render nothing.
   */
  return (el: PhotoElement): string | undefined =>
    el.thumbSrc ||
    (el.src?.startsWith('blob:') ? el.src : undefined) ||
    (el.photoId ? urls[el.photoId] : undefined)
}
