import { describe, it, expect } from 'vitest'
import {
  fullZone,
  rectZone,
  splitZonesByStroke,
  circleZoneByStroke,
  mergeZoneInto,
  zoneAtPoint,
  zonesToCells,
  cellsToZones,
  polyArea,
  polyBBox,
  sortZones,
  type Pt,
  type Zone,
} from '../customLayout'

const board = () => [fullZone()]

/** Straight stroke helper: n sampled points from a→b. */
function stroke(a: Pt, b: Pt, n = 12): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  })
}

/** Closed loop around a centre, used for the circle tool. */
function loop(cx: number, cy: number, rx: number, ry = rx, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }
  })
}

const totalArea = (zones: Zone[]) =>
  zones.filter((z) => !z.overlay).reduce((s, z) => s + polyArea(z.poly), 0)

/** Split, asserting the gesture was accepted. */
const cut = (zones: Zone[], pts: Pt[], snapStep?: number) => {
  const out = splitZonesByStroke(zones, pts, { snapStep })
  expect(out).not.toBeNull()
  return out!
}

describe('splitZonesByStroke — axis-aligned cuts', () => {
  it('rejects a gesture too small to be a deliberate cut', () => {
    expect(
      splitZonesByStroke(board(), stroke({ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.5 })),
    ).toBeNull()
  })

  it('a horizontal drag splits the board into two exact rows', () => {
    const cells = zonesToCells(cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 })))
    expect(cells).toHaveLength(2)
    expect(cells[0]).toMatchObject({ x: 0, y: 0, width: 1, height: 0.5 })
    expect(cells[1]).toMatchObject({ x: 0, y: 0.5, width: 1, height: 0.5 })
    // Plain rectangles stay plain — no polygon payload.
    expect(cells[0].shape).toBeUndefined()
  })

  it('a vertical drag splits the board into two exact columns', () => {
    const cells = zonesToCells(cut(board(), stroke({ x: 0.5, y: 0.05 }, { x: 0.5, y: 0.95 })))
    expect(cells).toHaveLength(2)
    expect(cells[0]).toMatchObject({ x: 0, y: 0, width: 0.5, height: 1 })
    expect(cells[1]).toMatchObject({ x: 0.5, y: 0, width: 0.5, height: 1 })
  })

  it('a wobbly freehand stroke still produces a clean straight cut', () => {
    const wobbly: Pt[] = Array.from({ length: 20 }, (_, i) => ({
      x: 0.05 + (i / 19) * 0.9,
      y: 0.5 + Math.sin(i) * 0.01,
    }))
    const cells = zonesToCells(cut(board(), wobbly))
    expect(cells).toHaveLength(2)
    expect(cells[0].height).toBeCloseTo(cells[1].height, 3)
    expect(cells[0].width).toBeCloseTo(1, 6)
  })

  it('snaps the cut position when snapStep is given', () => {
    const cells = zonesToCells(
      cut(board(), stroke({ x: 0.05, y: 0.43 }, { x: 0.95, y: 0.43 }), 0.05),
    )
    expect(cells[0].height).toBeCloseTo(0.45, 6)
  })

  it('accepts a cut on the outermost snap position instead of ignoring it', () => {
    // Regression: MIN_CELL (0.06) used to veto every cut snapped to 0.05.
    const cells = zonesToCells(
      cut(board(), stroke({ x: 0.05, y: 0.055 }, { x: 0.95, y: 0.055 }), 0.05),
    )
    expect(cells).toHaveLength(2)
    expect(cells[0].height).toBeCloseTo(0.05, 6)
  })

  it('still cuts when the stroke overshoots the board edges', () => {
    const cells = zonesToCells(cut(board(), stroke({ x: -0.2, y: 0.5 }, { x: 1.2, y: 0.5 })))
    expect(cells).toHaveLength(2)
  })

  it('still cuts when the stroke stops well short of both edges', () => {
    // Regression: CROSS_RATIO used to demand 35% coverage of the cell.
    const cells = zonesToCells(cut(board(), stroke({ x: 0.42, y: 0.5 }, { x: 0.58, y: 0.5 })))
    expect(cells).toHaveLength(2)
  })

  it('only splits the zones the stroke actually travels across', () => {
    const rows = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const out = cut(rows, stroke({ x: 0.5, y: 0.6 }, { x: 0.5, y: 0.95 }))
    const cells = zonesToCells(out)
    expect(cells).toHaveLength(3)
    expect(cells.filter((c) => c.y === 0)).toHaveLength(1)
    expect(cells.filter((c) => c.y === 0.5)).toHaveLength(2)
  })

  it('a full-length stroke splits every crossed zone at once', () => {
    const rows = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(cut(rows, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))).toHaveLength(4)
  })

  it('refuses a cut that would leave an unusable sliver', () => {
    expect(
      splitZonesByStroke(board(), stroke({ x: 0.05, y: 0.005 }, { x: 0.95, y: 0.005 })),
    ).toBeNull()
  })

  it('conserves total area across repeated cuts', () => {
    let zones = board()
    zones = cut(zones, stroke({ x: 0.05, y: 0.4 }, { x: 0.95, y: 0.4 }))
    zones = cut(zones, stroke({ x: 0.3, y: 0.45 }, { x: 0.3, y: 0.95 }))
    zones = cut(zones, stroke({ x: 0.05, y: 0.2 }, { x: 0.95, y: 0.2 }))
    expect(totalArea(zones)).toBeCloseTo(1, 6)
  })

  it('returns zones in reading order', () => {
    let zones = board()
    zones = cut(zones, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    zones = cut(zones, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))
    expect(zones).toEqual(sortZones(zones))
  })
})

describe('splitZonesByStroke — oblique cuts', () => {
  it('a 45° stroke splits the board into two triangles', () => {
    const zones = cut(board(), stroke({ x: 0.02, y: 0.02 }, { x: 0.98, y: 0.98 }))
    expect(zones).toHaveLength(2)
    expect(totalArea(zones)).toBeCloseTo(1, 6)
    for (const z of zones) expect(polyArea(z.poly)).toBeCloseTo(0.5, 6)
  })

  it('emits polygon cells for oblique pieces', () => {
    const cells = zonesToCells(cut(board(), stroke({ x: 0.02, y: 0.1 }, { x: 0.98, y: 0.9 })))
    expect(cells).toHaveLength(2)
    for (const c of cells) {
      expect(c.shape).toBe('polygon')
      expect(c.polygon!.length).toBeGreaterThanOrEqual(3)
      // Normalised into the cell's own bounding box.
      for (const p of c.polygon!) {
        expect(p.x).toBeGreaterThanOrEqual(-1e-6)
        expect(p.x).toBeLessThanOrEqual(1 + 1e-6)
        expect(p.y).toBeGreaterThanOrEqual(-1e-6)
        expect(p.y).toBeLessThanOrEqual(1 + 1e-6)
      }
    }
  })

  it('keeps a near-axis stroke perfectly axis-aligned', () => {
    // ~3° off horizontal — should still yield exact rectangles.
    const cells = zonesToCells(cut(board(), stroke({ x: 0.05, y: 0.48 }, { x: 0.95, y: 0.53 })))
    expect(cells.every((c) => c.shape === undefined)).toBe(true)
    expect(cells[0].width).toBeCloseTo(1, 6)
  })

  it('cuts an already-oblique zone again', () => {
    let zones = cut(board(), stroke({ x: 0.02, y: 0.02 }, { x: 0.98, y: 0.98 }))
    zones = cut(zones, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(zones.length).toBeGreaterThan(2)
    expect(totalArea(zones)).toBeCloseTo(1, 6)
  })
})

describe('circleZoneByStroke', () => {
  it('rounds off the zone the loop was drawn in', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.3))!
    expect(zones).toHaveLength(1)
    expect(zones[0].shape).toBe('circle')
    expect(zonesToCells(zones)[0].shape).toBe('circle')
  })

  it('uses an ellipse when the loop is clearly not round', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.4, 0.12))!
    expect(zones[0].shape).toBe('ellipse')
  })

  it('rounds only the zone under the loop', () => {
    const rows = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const zones = circleZoneByStroke(rows, loop(0.5, 0.75, 0.2))!
    expect(zones[0].shape).toBeUndefined()
    expect(zones[1].shape).toBe('circle')
  })

  it('adds a floating round zone in overlay mode without consuming the parent', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.2), { overlay: true })!
    expect(zones).toHaveLength(2)
    expect(zones[0].overlay).toBeUndefined()
    // The board zone keeps its full area — the overlay floats on top.
    expect(totalArea(zones)).toBeCloseTo(1, 6)
    const overlay = zones.find((z) => z.overlay)!
    expect(overlay.shape).toBe('circle')
    expect(polyBBox(overlay.poly).width).toBeCloseTo(0.4, 2)
  })

  it('sorts overlays last so they render on top', () => {
    const zones = circleZoneByStroke(
      cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 })),
      loop(0.5, 0.5, 0.15),
      { overlay: true },
    )!
    expect(sortZones(zones)[2].overlay).toBe(true)
  })

  it('ignores a loop drawn too small to be deliberate', () => {
    expect(circleZoneByStroke(board(), loop(0.5, 0.5, 0.005))).toBeNull()
  })

  it('leaves overlays alone when a later stroke cuts the board', () => {
    const withOverlay = circleZoneByStroke(board(), loop(0.5, 0.5, 0.2), { overlay: true })!
    const zones = cut(withOverlay, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(zones.filter((z) => z.overlay)).toHaveLength(1)
    expect(zones.filter((z) => !z.overlay)).toHaveLength(2)
  })
})

describe('zoneAtPoint', () => {
  it('finds the containing zone', () => {
    const zones = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    expect(zoneAtPoint(zones, { x: 0.5, y: 0.2 })).toBe(0)
    expect(zoneAtPoint(zones, { x: 0.5, y: 0.8 })).toBe(1)
  })

  it('prefers an overlay over the zone beneath it', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.2), { overlay: true })!
    expect(zones[zoneAtPoint(zones, { x: 0.5, y: 0.5 })].overlay).toBe(true)
  })
})

describe('mergeZoneInto', () => {
  it('merges a zone back into its neighbour', () => {
    const zones = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const merged = mergeZoneInto(zones, 0)!
    expect(merged).toHaveLength(1)
    expect(zonesToCells(merged)[0]).toMatchObject({ x: 0, y: 0, width: 1, height: 1 })
  })

  it('merges two triangles back into the whole board', () => {
    const zones = cut(board(), stroke({ x: 0.02, y: 0.02 }, { x: 0.98, y: 0.98 }))
    const merged = mergeZoneInto(zones, 0)!
    expect(merged).toHaveLength(1)
    expect(polyArea(merged[0].poly)).toBeCloseTo(1, 6)
  })

  it('still merges after several splits', () => {
    // Regression: the old equal-width/height test failed once the grid was
    // more than two levels deep.
    let zones = board()
    zones = cut(zones, stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    zones = cut(zones, stroke({ x: 0.5, y: 0.02 }, { x: 0.5, y: 0.98 }))
    zones = cut(zones, stroke({ x: 0.05, y: 0.25 }, { x: 0.45, y: 0.25 }))
    expect(zones).toHaveLength(5)
    const merged = mergeZoneInto(zones, 0)!
    expect(merged).toHaveLength(4)
    expect(totalArea(merged)).toBeCloseTo(1, 6)
  })

  it('removes an overlay outright', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.2), { overlay: true })!
    const merged = mergeZoneInto(zones, zones.findIndex((z) => z.overlay))!
    expect(merged).toHaveLength(1)
    expect(merged[0].overlay).toBeUndefined()
  })

  it('refuses when no neighbour forms a clean shape', () => {
    expect(mergeZoneInto(board(), 0)).toBeNull()
    // Two zones that only touch at a corner cannot merge cleanly.
    const apart = [rectZone(0, 0, 0.5, 0.5), rectZone(0.5, 0.5, 0.5, 0.5)]
    expect(mergeZoneInto(apart, 0)).toBeNull()
  })
})

describe('zonesToCells / cellsToZones', () => {
  it('round-trips rectangles', () => {
    const zones = cut(board(), stroke({ x: 0.05, y: 0.5 }, { x: 0.95, y: 0.5 }))
    const back = cellsToZones(zonesToCells(zones))
    expect(totalArea(back)).toBeCloseTo(1, 6)
    expect(zonesToCells(back)).toEqual(zonesToCells(zones))
  })

  it('round-trips oblique polygons', () => {
    const zones = cut(board(), stroke({ x: 0.02, y: 0.02 }, { x: 0.98, y: 0.98 }))
    const back = cellsToZones(zonesToCells(zones))
    expect(back).toHaveLength(2)
    for (const z of back) expect(polyArea(z.poly)).toBeCloseTo(0.5, 6)
  })

  it('round-trips round zones', () => {
    const zones = circleZoneByStroke(board(), loop(0.5, 0.5, 0.3))!
    expect(cellsToZones(zonesToCells(zones))[0].shape).toBe('circle')
  })
})
