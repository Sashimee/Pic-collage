import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractPalette, suggestBackground } from '../colorExtract'

describe('extractPalette', () => {
  let origRandom: () => number
  let origCreateElement: typeof document.createElement
  let origImage: typeof Image

  beforeEach(() => {
    origRandom = Math.random
    origCreateElement = document.createElement.bind(document)
    origImage = globalThis.Image

    // Deterministic random sequence to ensure k-means++ picks distinct centroids
    const randSeq = [0, 0.5, 0.99, 0.1, 0.2]
    let rIdx = 0
    Math.random = () => randSeq[(rIdx++) % randSeq.length]

    class MockImage {
      crossOrigin = ''
      naturalWidth = 6
      naturalHeight = 2
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      private _src = ''
      set src(val: string) {
        this._src = val
        queueMicrotask(() => this.onload?.())
      }
      get src() {
        return this._src
      }
    }
    globalThis.Image = MockImage as any

    // 33×1 pixel buffer = 132 bytes. extractPalette samples every 16th byte.
    // We place red/green/blue at indices 0,16,32,48,64,80,96,112,128
    // so each color appears 3 times.
    const pixelData = new Uint8ClampedArray(132)
    const sampleIdxs = [0, 16, 32, 48, 64, 80, 96, 112, 128]
    const colors = [
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
    ]
    for (let i = 0; i < sampleIdxs.length; i++) {
      const idx = sampleIdxs[i]
      pixelData[idx] = colors[i][0]
      pixelData[idx + 1] = colors[i][1]
      pixelData[idx + 2] = colors[i][2]
      pixelData[idx + 3] = 255
    }
    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: pixelData })),
    }
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockCtx),
    }
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas as any
      return origCreateElement(tag)
    }) as any
  })

  afterEach(() => {
    Math.random = origRandom
    document.createElement = origCreateElement
    globalThis.Image = origImage
  })

  it('returns dominant colors from a mocked image', async () => {
    const palette = await extractPalette('dummy.png', 3)
    expect(palette).toHaveLength(3)
    expect(palette).toContain('#ff0000')
    expect(palette).toContain('#00ff00')
    expect(palette).toContain('#0000ff')
  })

  it('returns exactly k colors even when k > distinct samples', async () => {
    const palette = await extractPalette('dummy.png', 5)
    expect(palette).toHaveLength(5)
  })
})

describe('suggestBackground', () => {
  it('suggests gradient when palette has 2+ colors', () => {
    const bg = suggestBackground(['#ff0000', '#00ff00'])
    expect(bg.type).toBe('gradient')
    expect(bg.gradientFrom).toBe('#ff0000')
    expect(bg.gradientTo).toBe('#00ff00')
  })

  it('falls back to solid when palette has 1 color', () => {
    const bg = suggestBackground(['#3366ff'])
    expect(bg.type).toBe('solid')
    expect(bg.color).toBe('#3366ff')
  })

  it('uses safe defaults for empty palette', () => {
    const bg = suggestBackground([])
    expect(bg.type).toBe('solid')
    expect(bg.color).toBe('#ffffff')
  })
})
