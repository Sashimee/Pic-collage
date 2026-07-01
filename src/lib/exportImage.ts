import type Konva from 'konva'

export type ExportFormat = 'png' | 'jpg'

// Render the collage board (a Konva.Group holding the background + elements) to
// a data URL at full board resolution, independent of the current view zoom.
export function exportBoard(
  board: Konva.Group,
  boardWidth: number,
  boardHeight: number,
  format: ExportFormat,
  pixelRatio = 2,
): string {
  const prev = {
    x: board.x(),
    y: board.y(),
    scaleX: board.scaleX(),
    scaleY: board.scaleY(),
    rotation: board.rotation(),
  }
  board.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })

  const url = board.toDataURL({
    x: 0,
    y: 0,
    width: boardWidth,
    height: boardHeight,
    pixelRatio,
    mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
    quality: 0.92,
  })

  board.setAttrs(prev)
  return url
}

function dataURLToBlob(dataURL: string): Blob {
  const [head, body] = dataURL.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function downloadDataURL(dataURL: string, format: ExportFormat): void {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = `collage-${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function canShareImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    'share' in navigator
  )
}

// Share via the Web Share API; returns false if unsupported or cancelled so the
// caller can fall back to a plain download.
export async function shareDataURL(
  dataURL: string,
  format: ExportFormat,
): Promise<boolean> {
  if (!canShareImage()) return false
  const blob = dataURLToBlob(dataURL)
  const file = new File([blob], `collage.${format === 'png' ? 'png' : 'jpg'}`, {
    type: blob.type,
  })
  if (!navigator.canShare({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title: 'My Collage' })
    return true
  } catch {
    return false
  }
}
