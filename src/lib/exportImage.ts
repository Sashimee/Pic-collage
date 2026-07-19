import type Konva from 'konva'

export type ExportFormat = 'png' | 'jpg' | 'webp'

export type ExportPreset =
  | 'original'
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'a4'

const PRESET_DIMS: Record<ExportPreset, { width: number; height: number }> = {
  original: { width: 0, height: 0 }, // use board dimensions
  'instagram-square': { width: 1080, height: 1080 },
  'instagram-portrait': { width: 1080, height: 1350 },
  'instagram-story': { width: 1080, height: 1920 },
  a4: { width: 2480, height: 3508 },
}

// Render the collage board to a data URL at full board resolution,
// with optional format, quality, and platform preset.
export function exportBoard(
  board: Konva.Group,
  boardWidth: number,
  boardHeight: number,
  format: ExportFormat,
  options: {
    quality?: number
    preset?: ExportPreset
    pixelRatio?: number
  } = {},
): string {
  const { quality = 0.92, preset = 'original', pixelRatio = 2 } = options
  const dims = PRESET_DIMS[preset]

  const prev = {
    x: board.x(),
    y: board.y(),
    scaleX: board.scaleX(),
    scaleY: board.scaleY(),
    rotation: board.rotation(),
  }
  board.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })

  const mimeType =
    format === 'png'
      ? 'image/png'
      : format === 'webp'
        ? 'image/webp'
        : 'image/jpeg'

  // If preset has explicit dimensions, export at that size (cropping/centering)
  const exportW = dims.width > 0 ? dims.width : boardWidth
  const exportH = dims.height > 0 ? dims.height : boardHeight

  const url = board.toDataURL({
    x: 0,
    y: 0,
    width: exportW,
    height: exportH,
    pixelRatio,
    mimeType,
    quality,
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

export function downloadDataURL(
  dataURL: string,
  format: ExportFormat,
  filename?: string,
): void {
  const a = document.createElement('a')
  a.href = dataURL
  a.download =
    filename || `collage-${Date.now()}.${format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg'}`
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
  title = 'My Collage',
): Promise<boolean> {
  if (!canShareImage()) return false
  const blob = dataURLToBlob(dataURL)
  const file = new File(
    [blob],
    `collage.${format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg'}`,
    { type: blob.type },
  )
  if (!navigator.canShare({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title })
    return true
  } catch {
    return false
  }
}
