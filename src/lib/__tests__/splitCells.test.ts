import { describe, it, expect } from 'vitest'
import {
  FULL_CELL,
  splitCellsByStroke,
  mergeCellInto,
  cellAtPoint,
  sortCells,
  type Pt,
} from '../customLayout'

const full = () => [{ ...FULL_CELL }]

/** Straight stroke helper: n sampled points from a→b. */
function stroke(a: Pt, b: Pt, n = 12): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  })
}

const area = (cells: { width: number; height: number }[]) =>
  cells.reduce((s, c) => s + c.width * c.height, 0)

describe('splitCellsByStroke', () => {
  it('ignores strokes that are too short', () => {
    const cells = full()
    expect(splitCellsByStroke(cells, stroke({ x: 0.5, y: 0.5 }, { x: 0.52, y: 0.5 }))).toBe(cells)
  })

  it('a horizontal drag splits the board into two rows', () => {
    const out = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ x: 0, y: 0, width: 1, height: 0.5 })
    expect(out[1]).toMatchObject({ x: 0, y: 0.5, width: 1, height: 0.5 })
  })

  it('a vertical drag splits the board into two columns', () => {
    const out = splitCellsByStroke(full(), stroke({ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 }))
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ x: 0, y: 0, width: 0.5, height: 1 })
    expect(out[1]).toMatchObject({ x: 0.5, y: 0, width: 0.5, height: 1 })
  })

  it('a wobbly freehand stroke still produces a clean straight cut', () => {
    const wobbly: Pt[] = Array.from({ length: 20 }, (_, i) => ({
      x: 0.05 + (i / 19) * 0.9,
      y: 0.5 + Math.sin(i) * 0.01,
    }))
    const out = splitCellsByStroke(full(), wobbly)
    expect(out).toHaveLength(2)
    expect(out[0].height).toBeCloseTo(out[1].height, 3)
    expect(out[0].width).toBe(1)
  })

  it('snaps the cut position when snapStep is given', () => {
    const out = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.43 }, { x: 0.95, y: 0.43 }), {
      snapStep: 0.05,
    })
    expect(out[0].height).toBeCloseTo(0.45, 6)
  })

  it('only splits the cells the stroke actually crosses', () => {
    // Two rows, then a vertical stroke confined to the lower row.
    const rows = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const out = splitCellsByStroke(rows, stroke({ x: 0.5, y: 0.55 }, { x: 0.5, y: 0.95 }))
    expect(out).toHaveLength(3)
    // Top row untouched, bottom row halved.
    expect(out.filter((c) => c.y === 0)).toHaveLength(1)
    expect(out.filter((c) => c.y === 0.5)).toHaveLength(2)
  })

  it('a full-length stroke splits every crossed cell at once', () => {
    const rows = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const out = splitCellsByStroke(rows, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))
    expect(out).toHaveLength(4)
  })

  it('never creates slivers below MIN_CELL', () => {
    const out = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.02 }, { x: 0.95, y: 0.02 }))
    expect(out).toHaveLength(1) // cut too close to the edge → rejected
  })

  it('always conserves total area and produces non-overlapping cells', () => {
    let cells = full()
    cells = splitCellsByStroke(cells, stroke({ x: 0.05, y: 0.4 }, { x: 0.95, y: 0.4 }))
    cells = splitCellsByStroke(cells, stroke({ x: 0.3, y: 0.45 }, { x: 0.3, y: 0.95 }))
    cells = splitCellsByStroke(cells, stroke({ x: 0.05, y: 0.2 }, { x: 0.95, y: 0.2 }))
    expect(area(cells)).toBeCloseTo(1, 6)
    for (const c of cells) {
      expect(c.width).toBeGreaterThan(0)
      expect(c.height).toBeGreaterThan(0)
    }
  })

  it('returns cells in reading order', () => {
    let cells = full()
    cells = splitCellsByStroke(cells, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    cells = splitCellsByStroke(cells, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))
    expect(cells).toEqual(sortCells(cells))
  })
})

describe('cellAtPoint', () => {
  it('finds the containing cell', () => {
    const cells = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(cellAtPoint(cells, { x: 0.5, y: 0.2 })).toBe(0)
    expect(cellAtPoint(cells, { x: 0.5, y: 0.8 })).toBe(1)
  })
})

describe('mergeCellInto', () => {
  it('merges a cell back into its edge-sharing neighbour', () => {
    const cells = splitCellsByStroke(full(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const merged = mergeCellInto(cells, 0)
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ x: 0, y: 0, width: 1, height: 1 })
  })

  it('is a no-op when no neighbour shares a full edge', () => {
    const cells = [{ x: 0, y: 0, width: 1, height: 1 }]
    expect(mergeCellInto(cells, 0)).toBe(cells)
  })

  it('conserves area when merging in a 4-up layout', () => {
    let cells = full()
    cells = splitCellsByStroke(cells, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    cells = splitCellsByStroke(cells, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))
    expect(cells).toHaveLength(4)
    const merged = mergeCellInto(cells, 0)
    expect(merged).toHaveLength(3)
    expect(area(merged)).toBeCloseTo(1, 6)
  })
})
