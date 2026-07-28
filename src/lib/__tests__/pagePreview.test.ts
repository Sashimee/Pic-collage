import { describe, it, expect } from 'vitest'
import { backgroundStyle, frameBorder, previewPhotos } from '../pagePreview'
import type { Background, PhotoElement } from '../../types'
import type { LoadedDocument } from '../../store/editorStore'

const background: Background = {
  type: 'solid',
  color: '#ffffff',
  gradientFrom: '#6366f1',
  gradientTo: '#ec4899',
  gradientAngle: 0,
  patternId: 'dots',
  patternColor: '#000000',
}

const photo = (id: string, over: Partial<PhotoElement> = {}): PhotoElement => ({
  id,
  type: 'photo',
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  src: '',
  width: 200,
  height: 100,
  filters: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    vignette: 0,
    preset: 'none',
  },
  ...over,
})

const page = (over: Partial<LoadedDocument> = {}): LoadedDocument => ({
  boardWidth: 1000,
  boardHeight: 1000,
  background,
  mode: 'free',
  gridId: null,
  gridGap: 0,
  gridRadius: 0,
  frame: { style: 'none', color: '#000000', width: 0 },
  elements: [],
  ...over,
})

describe('previewPhotos', () => {
  it('places free photos at their own coordinates and size', () => {
    const el = photo('a', { x: 40, y: 60, scaleX: 2, rotation: 15 })
    const [p] = previewPhotos(page({ elements: [el] }))
    expect(p).toMatchObject({ x: 40, y: 60, w: 400, h: 100, rotation: 15, cover: false })
  })

  it('lays a grid page out from its cells, not the photos own coordinates', () => {
    // A grid photo's x/y are meaningless — GridView positions it by cell — so
    // reading them would pile every photo into the top-left corner.
    const els = [photo('a', { x: 900, y: 900 }), photo('b', { x: 900, y: 900 })]
    const out = previewPhotos(page({ mode: 'grid', gridId: '2-v', elements: els }))

    expect(out).toHaveLength(2)
    expect(out.every((p) => p.cover)).toBe(true)
    expect(out[0].x).toBe(0)
    expect(out[1].x).toBeGreaterThan(0) // second column, not stacked on the first
    expect(out.some((p) => p.x === 900)).toBe(false)
  })

  it('honours a photo pinned to a cell', () => {
    const els = [photo('a', { cellIndex: 1 }), photo('b')]
    const out = previewPhotos(page({ mode: 'grid', gridId: '2-v', elements: els }))
    expect(out.map((p) => p.el.id)).toEqual(['b', 'a'])
  })

  it('falls back to free placement when the layout id is unknown', () => {
    const out = previewPhotos(page({ mode: 'grid', gridId: 'nope', elements: [photo('a')] }))
    expect(out[0].cover).toBe(false)
  })

  it('skips hidden photos and caps how many it draws', () => {
    const els = [
      photo('h', { hidden: true }),
      ...Array.from({ length: 5 }, (_, i) => photo(`p${i}`)),
    ]
    const out = previewPhotos(page({ elements: els }), 3)
    expect(out).toHaveLength(3)
    expect(out.some((p) => p.el.id === 'h')).toBe(false)
  })
})

describe('backgroundStyle', () => {
  it('converts the board gradient angle into the CSS one', () => {
    // The board stores a direction vector (cos θ, sin θ) with y down, so θ=0
    // runs left→right. CSS measures clockwise from "to top", where left→right
    // is 90deg. Getting this backwards mirrors every gradient in the strip.
    expect(backgroundStyle({ ...background, type: 'gradient', gradientAngle: 0 }).backgroundImage)
      .toContain('90deg')
    expect(backgroundStyle({ ...background, type: 'gradient', gradientAngle: 90 }).backgroundImage)
      .toContain('180deg')
    expect(backgroundStyle({ ...background, type: 'gradient', gradientAngle: 270 }).backgroundImage)
      .toContain('360deg')
  })

  it('keeps the gradient colours in order', () => {
    const css = backgroundStyle({ ...background, type: 'gradient' }).backgroundImage
    expect(css).toContain('#6366f1')
    expect(css!.indexOf('#6366f1')).toBeLessThan(css!.indexOf('#ec4899'))
  })

  it('uses the flat colour for a solid background', () => {
    expect(backgroundStyle(background)).toEqual({ backgroundColor: '#ffffff' })
  })

  it('falls back to the flat colour when a photo background has no source', () => {
    expect(backgroundStyle({ ...background, type: 'photo' })).toEqual({
      backgroundColor: '#ffffff',
    })
  })

  it('draws a photo background faded, as the board does', () => {
    const style = backgroundStyle({ ...background, type: 'photo' }, 'blob:x')
    expect(style.backgroundImage).toBe('url(blob:x)')
    expect(style.opacity).toBe(0.4)
  })
})

describe('frameBorder', () => {
  it('is absent when there is no frame', () => {
    expect(frameBorder(page(), 0.05)).toBeUndefined()
  })

  it('scales the border with the tile, from the shorter board axis', () => {
    const p = page({
      boardWidth: 1000,
      boardHeight: 2000,
      frame: { style: 'solid', color: '#ff0000', width: 0.1 },
    })
    // 0.1 × min(1000, 2000) × 0.05 = 5
    expect(frameBorder(p, 0.05)?.border).toBe('5px solid #ff0000')
  })

  it('never disappears entirely on a tiny thumbnail', () => {
    const p = page({ frame: { style: 'solid', color: '#000', width: 0.001 } })
    expect(frameBorder(p, 0.01)?.border).toBe('1px solid #000')
  })
})
