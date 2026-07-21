// Simplified clone-stamp / healing tool using Canvas getImageData/putImageData.

export interface HealState {
  sourceX: number
  sourceY: number
  active: boolean
  brushSize: number
}

export const DEFAULT_HEAL_STATE: HealState = {
  sourceX: -1,
  sourceY: -1,
  active: false,
  brushSize: 12,
}

/** Load an image into an offscreen canvas and return the context + dimensions. */
export async function imageToCanvas(src: string): Promise<{
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
}> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return { canvas, ctx, width: img.naturalWidth, height: img.naturalHeight }
}

/** Copy pixels from source point to target point with soft edges. */
export function stampClone(
  srcData: ImageData,
  dstData: ImageData,
  width: number,
  height: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  radius: number,
) {
  const r = Math.max(1, Math.round(radius))
  const r2 = r * r

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist2 = dx * dx + dy * dy
      if (dist2 > r2) continue
      const sx = Math.round(sourceX + dx)
      const sy = Math.round(sourceY + dy)
      const tx = Math.round(targetX + dx)
      const ty = Math.round(targetY + dy)
      if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue
      if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue

      const sIdx = (sy * width + sx) * 4
      const tIdx = (ty * width + tx) * 4

      // Soft-edge alpha based on distance from center
      const alpha = Math.max(0, 1 - Math.sqrt(dist2) / r)

      dstData.data[tIdx] = dstData.data[tIdx] + (srcData.data[sIdx] - dstData.data[tIdx]) * alpha
      dstData.data[tIdx + 1] =
        dstData.data[tIdx + 1] + (srcData.data[sIdx + 1] - dstData.data[tIdx + 1]) * alpha
      dstData.data[tIdx + 2] =
        dstData.data[tIdx + 2] + (srcData.data[sIdx + 2] - dstData.data[tIdx + 2]) * alpha
      dstData.data[tIdx + 3] = 255
    }
  }
}

/** Apply a series of stamp strokes to an image and return a data URL. */
export async function applyHealStrokes(
  src: string,
  strokes: { sourceX: number; sourceY: number; targetX: number; targetY: number; radius: number }[],
): Promise<string> {
  const { canvas, ctx, width, height } = await imageToCanvas(src)
  const srcData = ctx.getImageData(0, 0, width, height)
  const dstData = ctx.getImageData(0, 0, width, height)

  for (const s of strokes) {
    stampClone(srcData, dstData, width, height, s.sourceX, s.sourceY, s.targetX, s.targetY, s.radius)
    // Update srcData for progressive blending
    srcData.data.set(dstData.data)
  }

  ctx.putImageData(dstData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}
