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

export interface WatermarkSettings {
  enabled: boolean
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number
  fontSize: number
  color: string
}

export interface PrintSettings {
  enabled: boolean
  bleedMarks: boolean
  cropMarks: boolean
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
    watermark?: WatermarkSettings
    print?: PrintSettings
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

  // Post-process watermark + print mode
  const processed = applyPostProcess(url, exportW * pixelRatio, exportH * pixelRatio, options.watermark, options.print, format, quality)
  return processed
}

function applyPostProcess(
  dataUrl: string,
  width: number,
  height: number,
  watermark?: WatermarkSettings,
  print?: PrintSettings,
  format: ExportFormat = 'png',
  quality = 0.92,
): string {
  const needsPost = watermark?.enabled || print?.enabled
  if (!needsPost) return dataUrl

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl

  const img = new Image()
  img.src = dataUrl
  // Synchronous draw — the image is already a data URL from the same origin
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  if (print?.enabled) {
    applyPrintEffects(ctx, canvas.width, canvas.height, print)
  }

  if (watermark?.enabled && watermark.text) {
    drawWatermark(ctx, canvas.width, canvas.height, watermark)
  }

  const mimeType =
    format === 'png'
      ? 'image/png'
      : format === 'webp'
        ? 'image/webp'
        : 'image/jpeg'

  return canvas.toDataURL(mimeType, quality)
}

function applyPrintEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  print: PrintSettings,
) {
  // CMYK-like simulation: reduce saturation ~30% via filter, then subtle color shift
  ctx.save()
  ctx.globalCompositeOperation = 'saturation'
  ctx.fillStyle = `rgba(128,128,128,${0.3})`
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  // Subtle warm/cool shift to simulate ink absorption
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, 'rgba(255, 240, 220, 0.08)')
  gradient.addColorStop(1, 'rgba(220, 240, 255, 0.06)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  // Approx 3mm in pixels at 300dpi ≈ 35px; scale relative to export resolution
  const mm3 = Math.max(12, Math.round(Math.min(width, height) * 0.016))

  ctx.save()
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = Math.max(1, Math.round(mm3 / 6))

  if (print.bleedMarks) {
    // Bleed border: rectangle inset by 3mm from edges
    const inset = mm3
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2)
  }

  if (print.cropMarks) {
    const cross = mm3 * 1.5
    const offset = mm3 * 0.5
    // Top-left corner
    ctx.beginPath()
    ctx.moveTo(offset, cross)
    ctx.lineTo(offset, offset)
    ctx.lineTo(cross, offset)
    ctx.stroke()
    // Top-right corner
    ctx.beginPath()
    ctx.moveTo(width - cross, offset)
    ctx.lineTo(width - offset, offset)
    ctx.lineTo(width - offset, cross)
    ctx.stroke()
    // Bottom-right corner
    ctx.beginPath()
    ctx.moveTo(width - offset, height - cross)
    ctx.lineTo(width - offset, height - offset)
    ctx.lineTo(width - cross, height - offset)
    ctx.stroke()
    // Bottom-left corner
    ctx.beginPath()
    ctx.moveTo(cross, height - offset)
    ctx.lineTo(offset, height - offset)
    ctx.lineTo(offset, height - cross)
    ctx.stroke()
  }

  ctx.restore()
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: WatermarkSettings,
) {
  const { text, position, opacity, fontSize, color } = watermark
  if (!text) return

  const padding = Math.round(Math.min(width, height) * 0.03)
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const th = fontSize // approximate height

  let x = padding
  let y = padding + th / 2

  switch (position) {
    case 'top-left':
      x = padding
      y = padding + th / 2
      break
    case 'top-right':
      x = width - padding - tw
      y = padding + th / 2
      break
    case 'bottom-left':
      x = padding
      y = height - padding - th / 2
      break
    case 'bottom-right':
      x = width - padding - tw
      y = height - padding - th / 2
      break
    case 'center':
      x = width / 2 - tw / 2
      y = height / 2
      break
  }

  // Subtle shadow for readability
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = Math.max(4, fontSize / 4)
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1

  ctx.fillText(text, x, y)
  ctx.restore()
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
  const blob = dataURLToBlob(dataURL)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    filename || `collage-${Date.now()}.${format === 'png' ? 'png' : format === 'webp' ? 'webp' : 'jpg'}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
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
