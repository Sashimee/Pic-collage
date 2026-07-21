import { describe, it, expect } from 'vitest'
import { computeCellsFromLines, type DividerLine } from '../customLayout'

describe('computeCellsFromLines', () => {
  it('returns one cell with no lines', () => {
    const cells = computeCellsFromLines([])
    expect(cells).toHaveLength(1)
    expect(cells[0]).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })

  it('splits into two with one horizontal line', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.5 },
    ])
    expect(cells).toHaveLength(2)
    expect(cells[0]).toEqual({ x: 0, y: 0, width: 1, height: 0.5 })
    expect(cells[1]).toEqual({ x: 0, y: 0.5, width: 1, height: 0.5 })
  })

  it('splits into two with one vertical line', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'vertical', position: 0.5 },
    ])
    expect(cells).toHaveLength(2)
    expect(cells[0]).toEqual({ x: 0, y: 0, width: 0.5, height: 1 })
    expect(cells[1]).toEqual({ x: 0.5, y: 0, width: 0.5, height: 1 })
  })

  it('splits into four with a cross', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.5 },
      { id: '2', type: 'vertical', position: 0.5 },
    ])
    expect(cells).toHaveLength(4)
    expect(cells).toContainEqual({ x: 0, y: 0, width: 0.5, height: 0.5 })
    expect(cells).toContainEqual({ x: 0.5, y: 0, width: 0.5, height: 0.5 })
    expect(cells).toContainEqual({ x: 0, y: 0.5, width: 0.5, height: 0.5 })
    expect(cells).toContainEqual({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })
  })

  it('creates three horizontal bands with two horizontal lines', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.33 },
      { id: '2', type: 'horizontal', position: 0.66 },
    ])
    expect(cells).toHaveLength(3)
    expect(cells).toContainEqual({ x: 0, y: 0, width: 1, height: 0.33 })
    expect(cells).toContainEqual({ x: 0, y: 0.33, width: 1, height: 0.33 })
    expect(cells).toContainEqual({ x: 0, y: 0.66, width: 1, height: 0.34 })
  })

  it('creates L-shaped region with a partial vertical line', () => {
    // Partial vertical line at x=0.5 from y=0 to y=0.5
    // Should create: left-top, right-top (half-height), and bottom (full-width)
    const cells = computeCellsFromLines([
      { id: '1', type: 'vertical', position: 0.5, start: 0, end: 0.5 },
    ])
    expect(cells.length).toBeGreaterThanOrEqual(2)
    // Verify total area sums to ~1 (allowing small float errors)
    const totalArea = cells.reduce((sum, c) => sum + c.width * c.height, 0)
    expect(totalArea).toBeCloseTo(1, 3)
    expect(cells).toContainEqual({ x: 0, y: 0, width: 0.5, height: 0.5 })
    expect(cells).toContainEqual({ x: 0.5, y: 0, width: 0.5, height: 0.5 })
    expect(cells).toContainEqual({ x: 0, y: 0.5, width: 1, height: 0.5 })
  })

  it('creates nine cells with a 2x3 grid of lines', () => {
    const lines: DividerLine[] = [
      { id: 'h1', type: 'horizontal', position: 1 / 3 },
      { id: 'h2', type: 'horizontal', position: 2 / 3 },
      { id: 'v1', type: 'vertical', position: 1 / 3 },
      { id: 'v2', type: 'vertical', position: 2 / 3 },
    ]
    const cells = computeCellsFromLines(lines)
    expect(cells).toHaveLength(9)
    // Verify all cell bounds sum to the full board area
    const totalArea = cells.reduce((sum, c) => sum + c.width * c.height, 0)
    expect(totalArea).toBeCloseTo(1, 3)
  })

  it('handles overlapping lines without duplicating cells', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.5 },
      { id: '2', type: 'horizontal', position: 0.5 },
      { id: '3', type: 'vertical', position: 0.5 },
      { id: '4', type: 'vertical', position: 0.5 },
    ])
    expect(cells).toHaveLength(4)
  })
})
