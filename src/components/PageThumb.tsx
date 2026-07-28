import type { PhotoElement } from '../types'
import type { LoadedDocument } from '../store/editorStore'
import { backgroundStyle, frameBorder, previewPhotos } from '../lib/pagePreview'

/**
 * A page drawn as plain DOM: background, then its photos where they actually
 * sit. Modelled on LayoutPreview, which does the same job for grid *shapes* —
 * this one shows content, so two pages built from the same shoot don't look
 * identical in the strip.
 */
export function PageThumb({
  page,
  width,
  height,
  srcFor,
  max = 6,
}: {
  page: LoadedDocument
  width: number
  height: number
  /** Object URL for a photo's thumbnail, if one is available yet. */
  srcFor: (el: PhotoElement) => string | undefined
  max?: number
}) {
  const scale = Math.min(width / page.boardWidth, height / page.boardHeight)
  const bg = backgroundStyle(page.background, page.background.photoSrc)
  const photos = previewPhotos(page, max)

  return (
    <div
      className="relative overflow-hidden rounded-md bg-surface-3"
      style={{ width, height, ...frameBorder(page, scale) }}
      aria-hidden="true"
    >
      <div className="absolute inset-0" style={bg} />
      {photos.map((p, i) => {
        const src = srcFor(p.el)
        if (!src) return null
        return (
          <img
            key={p.el.id ?? i}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            // Without this, pressing on a thumbnail starts the browser's own
            // image drag, which cancels the pointer stream after one move — so
            // the strip's reorder gesture silently did nothing.
            draggable={false}
            style={{
              position: 'absolute',
              left: p.x * scale,
              top: p.y * scale,
              width: p.w * scale,
              height: p.h * scale,
              // Konva rotates about the element's own origin, which is its
              // top-left — not the CSS default of the centre.
              transform: p.rotation ? `rotate(${p.rotation}deg)` : undefined,
              transformOrigin: 'top left',
              objectFit: p.cover ? 'cover' : 'fill',
              opacity: p.el.opacity ?? 1,
            }}
          />
        )
      })}
    </div>
  )
}
