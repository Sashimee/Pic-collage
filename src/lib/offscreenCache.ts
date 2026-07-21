// Offscreen canvas caching for static elements.
// Caches rendered element bitmaps so zoom/pan doesn't re-render filters/transforms.

interface CacheEntry {
  canvas: OffscreenCanvas | HTMLCanvasElement
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  key: string
  width: number
  height: number
}

const cache = new Map<string, CacheEntry>()

/** Generate a cache key from element properties that affect visual output. */
export function getCacheKey(el: {
  id: string
  type: string
  src?: string
  text?: string
  filters?: any
  filterStack?: any[]
  fill?: string
  stroke?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
  shapeType?: string
}): string {
  const parts = [el.type, el.id]
  if (el.src) parts.push(el.src.slice(-32))
  if (el.text) parts.push(el.text)
  if (el.fill) parts.push(el.fill)
  if (el.stroke) parts.push(el.stroke)
  if (el.strokeWidth) parts.push(String(el.strokeWidth))
  if (el.fontSize) parts.push(String(el.fontSize))
  if (el.fontFamily) parts.push(el.fontFamily.split(',')[0])
  if (el.shapeType) parts.push(el.shapeType)
  if (el.filterStack) parts.push(JSON.stringify(el.filterStack))
  else if (el.filters) parts.push(JSON.stringify(el.filters))
  return parts.join('|')
}

/** Create or retrieve a cached offscreen canvas for an element. */
export function getOffscreenCanvas(
  width: number,
  height: number,
  key: string,
): {
  canvas: OffscreenCanvas | HTMLCanvasElement
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
  isReused: boolean
} {
  const existing = cache.get(key)
  if (existing && existing.width >= width && existing.height >= height) {
    return { canvas: existing.canvas, ctx: existing.ctx, isReused: true }
  }

  let canvas: OffscreenCanvas | HTMLCanvasElement
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height)
    ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
  } else {
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    ctx = canvas.getContext('2d')!
  }

  const entry: CacheEntry = { canvas, ctx, key, width, height }
  cache.set(key, entry)

  // LRU eviction: keep max 50 entries
  if (cache.size > 50) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }

  return { canvas, ctx, isReused: false }
}

/** Clear all cached bitmaps (e.g., on "New" or memory pressure). */
export function clearOffscreenCache(): void {
  cache.clear()
}

/** Estimate memory usage of the cache in MB. */
export function getCacheMemoryMB(): number {
  let bytes = 0
  for (const entry of cache.values()) {
    bytes += entry.width * entry.height * 4 // RGBA
  }
  return bytes / (1024 * 1024)
}
