import { useEffect, useState } from 'react'

// Loads an HTMLImageElement from a URL for use as a Konva.Image `image` prop.
// Returns `undefined` until the bitmap is decoded.
export function useImage(src: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let active = true
    img.onload = () => {
      if (active) setImage(img)
    }
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  return image
}
