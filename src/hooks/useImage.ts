import { useEffect, useState } from 'react'

// Loads an HTMLImageElement from a URL for use as a Konva.Image `image` prop.
// Returns `undefined` until the bitmap is decoded.
export function useImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!src) return
    const img = new Image()
    // blob: and data: URLs are same-origin — adding crossOrigin breaks them
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous'
    }
    let active = true
    img.onload = () => {
      if (active) setImage(img)
    }
    img.onerror = () => {
      console.error('[useImage] failed to load:', src.slice(0, 80))
    }
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  return image
}
