import { describe, it, expect } from 'vitest'
import { CELL_SHAPE_PRESETS } from '../cellShapes'

describe('CELL_SHAPE_PRESETS', () => {
  it('contains all expected shape keys', () => {
    const expected = ['triangle', 'diamond', 'hexagon', 'pentagon', 'octagon']
    expect(Object.keys(CELL_SHAPE_PRESETS).sort()).toEqual(expected.sort())
  })

  it('triangle vertices are within 0..1 bounds', () => {
    const shape = CELL_SHAPE_PRESETS.triangle
    expect(shape).toHaveLength(3)
    for (const v of shape) {
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(0)
      expect(v.y).toBeLessThanOrEqual(1)
    }
  })

  it('diamond vertices are within 0..1 bounds', () => {
    const shape = CELL_SHAPE_PRESETS.diamond
    expect(shape).toHaveLength(4)
    for (const v of shape) {
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(0)
      expect(v.y).toBeLessThanOrEqual(1)
    }
  })

  it('hexagon vertices are within 0..1 bounds', () => {
    const shape = CELL_SHAPE_PRESETS.hexagon
    expect(shape).toHaveLength(6)
    for (const v of shape) {
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(0)
      expect(v.y).toBeLessThanOrEqual(1)
    }
  })

  it('pentagon vertices are within 0..1 bounds', () => {
    const shape = CELL_SHAPE_PRESETS.pentagon
    expect(shape).toHaveLength(5)
    for (const v of shape) {
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(0)
      expect(v.y).toBeLessThanOrEqual(1)
    }
  })

  it('octagon vertices are within 0..1 bounds', () => {
    const shape = CELL_SHAPE_PRESETS.octagon
    expect(shape).toHaveLength(8)
    for (const v of shape) {
      expect(v.x).toBeGreaterThanOrEqual(0)
      expect(v.x).toBeLessThanOrEqual(1)
      expect(v.y).toBeGreaterThanOrEqual(0)
      expect(v.y).toBeLessThanOrEqual(1)
    }
  })
})
