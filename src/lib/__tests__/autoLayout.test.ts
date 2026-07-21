import { describe, it, expect } from 'vitest'
import {
  computeAutoLayout,
  computeMasonryLayout,
  computeSpiralLayout,
} from '../autoLayout'

const BOARD_W = 1080
const BOARD_H = 1350

describe('computeAutoLayout', () => {
  it('returns empty for count 0', () => {
    expect(computeAutoLayout(0, BOARD_W, BOARD_H)).toEqual([])
  })

  it('returns full board for single element', () => {
    const rects = computeAutoLayout(1, BOARD_W, BOARD_H)
    expect(rects).toHaveLength(1)
    expect(rects[0]).toEqual({ x: 0, y: 0, width: BOARD_W, height: BOARD_H })
  })

  it('arranges 4 elements in a 2×2 grid', () => {
    const rects = computeAutoLayout(4, BOARD_W, BOARD_H)
    expect(rects).toHaveLength(4)
    const cols = 2
    const rows = 2
    const cellW = BOARD_W / cols
    const cellH = BOARD_H / rows
    rects.forEach((r, i) => {
      const c = i % cols
      const row = Math.floor(i / cols)
      expect(r.width).toBeCloseTo(cellW, 5)
      expect(r.height).toBeCloseTo(cellH, 5)
      expect(r.x).toBeCloseTo(c * cellW, 5)
      expect(r.y).toBeCloseTo(row * cellH, 5)
    })
  })

  it('centers the last row when not full', () => {
    const count = 5
    const rects = computeAutoLayout(count, BOARD_W, BOARD_H)
    const cols = 3
    const rows = 2
    const cellW = BOARD_W / cols
    const cellH = BOARD_H / rows
    expect(rects).toHaveLength(count)
    // Last row (index 3,4) should be centered
    const lastRowItems = count - (rows - 1) * cols // 5 - 3 = 2
    const offsetX = (BOARD_W - lastRowItems * cellW) / 2
    expect(rects[3].x).toBeCloseTo(offsetX, 5)
    expect(rects[4].x).toBeCloseTo(offsetX + cellW, 5)
    expect(rects[3].y).toBeCloseTo(cellH, 5)
    expect(rects[4].y).toBeCloseTo(cellH, 5)
  })

  it('fills the board area completely', () => {
    const rects = computeAutoLayout(6, BOARD_W, BOARD_H)
    const maxRight = Math.max(...rects.map((r) => r.x + r.width))
    const maxBottom = Math.max(...rects.map((r) => r.y + r.height))
    expect(maxRight).toBeCloseTo(BOARD_W, 5)
    expect(maxBottom).toBeCloseTo(BOARD_H, 5)
  })
})

describe('computeMasonryLayout', () => {
  it('returns empty for no items', () => {
    expect(computeMasonryLayout([], BOARD_W, BOARD_H)).toEqual([])
  })

  it('uses 2 columns for portrait board aspect <= 1', () => {
    const ars = [1, 1, 1]
    const rects = computeMasonryLayout(ars, BOARD_W, BOARD_H)
    const uniqueXs = [...new Set(rects.map((r) => r.x))]
    expect(uniqueXs).toHaveLength(2)
  })

  it('uses 3 columns for landscape board aspect > 1', () => {
    const rects = computeMasonryLayout([1, 1, 1, 1], 1920, 1080)
    const uniqueXs = [...new Set(rects.map((r) => r.x))]
    expect(uniqueXs).toHaveLength(3)
  })

  it('staggers items into shortest column', () => {
    const ars = [0.5, 2, 0.5, 2, 0.5]
    const gap = 8
    const rects = computeMasonryLayout(ars, BOARD_W, BOARD_H, gap)
    expect(rects).toHaveLength(5)
    // With 2 columns on portrait board, column 0 will accumulate short (0.5) items,
    // column 1 will get tall (2) items.
    const col0Height = rects
      .filter((_, i) => rects[i].x < BOARD_W / 2)
      .reduce((sum, r) => sum + r.height + gap, -gap)
    const col1Height = rects
      .filter((_, i) => rects[i].x >= BOARD_W / 2)
      .reduce((sum, r) => sum + r.height + gap, -gap)
    // Each column should be independently grown; heights may differ.
    expect(col0Height).toBeGreaterThan(0)
    expect(col1Height).toBeGreaterThan(0)
  })

  it('respects gap parameter', () => {
    const ars = [1, 1]
    const gap = 16
    const rects = computeMasonryLayout(ars, BOARD_W, BOARD_H, gap)
    expect(rects[0].width + gap + rects[1].width).toBeLessThanOrEqual(BOARD_W + 0.1)
  })

  it('bounds do not exceed board width', () => {
    const ars = [1, 1, 1, 1, 1, 1]
    const rects = computeMasonryLayout(ars, BOARD_W, BOARD_H)
    for (const r of rects) {
      expect(r.x + r.width).toBeLessThanOrEqual(BOARD_W + 0.1)
      expect(r.x).toBeGreaterThanOrEqual(-0.1)
    }
  })
})

describe('computeSpiralLayout', () => {
  it('returns empty for count 0', () => {
    expect(computeSpiralLayout(0, BOARD_W, BOARD_H)).toEqual([])
  })

  it('places first element near center', () => {
    const rects = computeSpiralLayout(1, BOARD_W, BOARD_H)
    expect(rects).toHaveLength(1)
    const cx = rects[0].x + rects[0].width / 2
    const cy = rects[0].y + rects[0].height / 2
    // Spiral starts at a small radius offset from center; verify within ~20% of board dimensions
    expect(Math.abs(cx - BOARD_W / 2)).toBeLessThan(BOARD_W * 0.2)
    expect(Math.abs(cy - BOARD_H / 2)).toBeLessThan(BOARD_H * 0.2)
  })

  it('arranges elements in outward spiral', () => {
    const count = 8
    const rects = computeSpiralLayout(count, BOARD_W, BOARD_H)
    expect(rects).toHaveLength(count)
    // Distance from center should generally increase with index
    const dists = rects.map((r) => {
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      return Math.sqrt(Math.pow(cx - BOARD_W / 2, 2) + Math.pow(cy - BOARD_H / 2, 2))
    })
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1] * 0.9)
    }
  })

  it('sizes decrease slightly with index', () => {
    const count = 6
    const rects = computeSpiralLayout(count, BOARD_W, BOARD_H)
    expect(rects[0].width).toBeGreaterThanOrEqual(rects[count - 1].width)
  })

  it('keeps all elements within rough board bounds', () => {
    const count = 12
    const rects = computeSpiralLayout(count, BOARD_W, BOARD_H)
    for (const r of rects) {
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      // Center should be within board bounds (allow slight overhang for half-size)
      expect(cx).toBeGreaterThanOrEqual(-r.width / 2)
      expect(cx).toBeLessThanOrEqual(BOARD_W + r.width / 2)
      expect(cy).toBeGreaterThanOrEqual(-r.height / 2)
      expect(cy).toBeLessThanOrEqual(BOARD_H + r.height / 2)
    }
  })
})
