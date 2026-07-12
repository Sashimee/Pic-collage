import type { PatternId } from '../types'

export const PATTERN_IDS: PatternId[] = [
  'dots',
  'stripes',
  'grid',
  'checker',
  'hearts',
]

// Build a small tileable canvas for a background pattern. Konva uses it as a
// repeating `fillPatternImage`. `bg` fills the tile, `fg` draws the motif.
export function makePatternTile(
  id: PatternId,
  bg: string,
  fg: string,
): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = fg
  ctx.strokeStyle = fg

  switch (id) {
    case 'dots':
      for (const [cx, cy] of [
        [16, 16],
        [48, 48],
      ]) {
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    case 'stripes':
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(-size, size)
      ctx.lineTo(size, -size)
      ctx.moveTo(0, size * 2)
      ctx.lineTo(size * 2, 0)
      ctx.stroke()
      break
    case 'grid':
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, size, size)
      break
    case 'checker':
      ctx.fillRect(0, 0, size / 2, size / 2)
      ctx.fillRect(size / 2, size / 2, size / 2, size / 2)
      break
    case 'hearts':
      drawHeart(ctx, 32, 34, 12)
      break
  }
  return canvas
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.3)
  ctx.bezierCurveTo(cx + s, cy - s * 0.6, cx + s * 0.5, cy - s, cx, cy - s * 0.35)
  ctx.bezierCurveTo(cx - s * 0.5, cy - s, cx - s, cy - s * 0.6, cx, cy + s * 0.3)
  ctx.closePath()
  ctx.fill()
}

export const PATTERN_GLYPH: Record<PatternId, string> = {
  dots: '⣿',
  stripes: '⁄',
  grid: '▦',
  checker: '▚',
  hearts: '♥',
}
