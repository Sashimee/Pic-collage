import type { GridCell } from '../types'

/* ------------------------------------------------------------------ *
 * Freehand zone splitting
 *
 * A zone is a convex polygon in normalised board coords (0..1). Drawing a
 * stroke fits a straight line through it (total least squares) and clips
 * every zone the stroke actually travels across into two halves. Working in
 * polygons rather than rectangles is what makes oblique cuts possible: an
 * axis-aligned cut still yields pixel-exact rectangles, a diagonal one yields
 * two triangles/trapezoids, and both round-trip to `GridCell` — which already
 * knows how to render `shape: 'polygon' | 'circle' | 'ellipse'`.
 * ------------------------------------------------------------------ */

export interface Pt {
  x: number
  y: number
}

/** Decorative shape drawn inside a zone's bounding box. */
export type ZoneShape = 'circle' | 'ellipse'

export interface Zone {
  /** Convex polygon, normalised board coords. */
  poly: Pt[]
  /** Round the zone off inside its bounding box. */
  shape?: ZoneShape
  /** Floats on top of the zones beneath it instead of consuming them. */
  overlay?: boolean
}

/** Below this span (fraction of the board) a gesture counts as a tap, not a cut. */
export const MIN_GESTURE = 0.03

/** A piece smaller than this fraction of the board is an unusable sliver. */
const MIN_ZONE_AREA = 0.005

/** …and neither side of its bounding box may be thinner than this. */
const MIN_ZONE_SIDE = 0.04

/**
 * How far past the drawn stroke the cut still reaches, so overshooting or
 * stopping just short of an edge both still work.
 */
const SEGMENT_SLACK = 0.05

/** Strokes within this many degrees of an axis snap to exactly that axis. */
const AXIS_SNAP_DEG = 12

const EPS = 1e-9

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const FULL_ZONE: Zone = {
  poly: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
}

export const fullZone = (): Zone => ({ poly: FULL_ZONE.poly.map((p) => ({ ...p })) })

export function rectZone(x: number, y: number, w: number, h: number): Zone {
  return {
    poly: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  }
}

/* ---------------------------------------------------------------- *
 * Polygon primitives
 * ---------------------------------------------------------------- */

export function polyArea(poly: Pt[]): number {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

export function polyBBox(poly: Pt[]): BBox {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of poly) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function pointInPoly(poly: Pt[], p: Pt): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Drop vertices that repeat or sit on a straight run — keeps clip output tidy. */
function cleanPoly(poly: Pt[]): Pt[] {
  const out: Pt[] = []
  for (const p of poly) {
    const last = out[out.length - 1]
    if (!last || Math.abs(last.x - p.x) > 1e-7 || Math.abs(last.y - p.y) > 1e-7) out.push(p)
  }
  while (
    out.length > 1 &&
    Math.abs(out[0].x - out[out.length - 1].x) < 1e-7 &&
    Math.abs(out[0].y - out[out.length - 1].y) < 1e-7
  ) {
    out.pop()
  }
  return out
}

/** Sutherland–Hodgman: keep the part of `poly` where dot(normal, p) <= offset. */
function clipHalfPlane(poly: Pt[], normal: Pt, offset: number): Pt[] {
  const out: Pt[] = []
  const dist = (p: Pt) => normal.x * p.x + normal.y * p.y - offset
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const da = dist(a)
    const db = dist(b)
    if (da <= 0) out.push(a)
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db)
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return cleanPoly(out)
}

/** Andrew's monotone chain. */
export function convexHull(pts: Pt[]): Pt[] {
  const sorted = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  if (sorted.length < 3) return sorted
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const build = (src: Pt[]) => {
    const half: Pt[] = []
    for (const p of src) {
      while (half.length >= 2 && cross(half[half.length - 2], half[half.length - 1], p) <= 0) {
        half.pop()
      }
      half.push(p)
    }
    half.pop()
    return half
  }
  return [...build(sorted), ...build([...sorted].reverse())]
}

function isUsable(poly: Pt[]): boolean {
  if (poly.length < 3) return false
  if (polyArea(poly) < MIN_ZONE_AREA) return false
  const b = polyBBox(poly)
  return Math.min(b.width, b.height) >= MIN_ZONE_SIDE
}

/* ---------------------------------------------------------------- *
 * Stroke → cut line
 * ---------------------------------------------------------------- */

export interface CutLine {
  /** A point the line passes through. */
  origin: Pt
  /** Unit direction along the line. */
  dir: Pt
  /** Unit normal; the line is `dot(normal, p) === offset`. */
  normal: Pt
  offset: number
  /** Extent of the drawn stroke along `dir`, already padded with slack. */
  from: number
  to: number
}

/** Total span of a stroke's bounding box — the tap-vs-drag discriminator. */
export function strokeSpan(pts: Pt[]): number {
  if (pts.length < 2) return 0
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
}

/**
 * Fit a straight line through the stroke by total least squares (the principal
 * axis of the point cloud), then snap near-axis-aligned strokes to the exact
 * axis so ordinary cuts still produce clean rectangles.
 */
export function fitCutLine(pts: Pt[], opts: { snapStep?: number } = {}): CutLine | null {
  if (pts.length < 2) return null

  const n = pts.length
  let cx = 0
  let cy = 0
  for (const p of pts) {
    cx += p.x
    cy += p.y
  }
  cx /= n
  cy /= n

  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const p of pts) {
    const dx = p.x - cx
    const dy = p.y - cy
    sxx += dx * dx
    syy += dy * dy
    sxy += dx * dy
  }

  // Principal axis of the covariance matrix.
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  let dir: Pt = { x: Math.cos(theta), y: Math.sin(theta) }

  // Fold the direction into (-90°, 90°] so the axis test is simple.
  if (dir.x < 0) dir = { x: -dir.x, y: -dir.y }
  const deg = Math.abs((Math.atan2(dir.y, dir.x) * 180) / Math.PI)
  if (deg <= AXIS_SNAP_DEG) dir = { x: 1, y: 0 }
  else if (deg >= 90 - AXIS_SNAP_DEG) dir = { x: 0, y: 1 }

  const normal: Pt = { x: -dir.y, y: dir.x }
  let origin: Pt = { x: cx, y: cy }

  // Position snapping only makes sense for axis-aligned cuts — snapping an
  // oblique line would drift it away from where the user drew.
  const step = opts.snapStep ?? 0
  if (step > 0) {
    if (dir.y === 0) origin = { x: cx, y: Math.round(cy / step) * step }
    else if (dir.x === 0) origin = { x: Math.round(cx / step) * step, y: cy }
  }

  const offset = normal.x * origin.x + normal.y * origin.y

  let from = Infinity
  let to = -Infinity
  for (const p of pts) {
    const t = (p.x - origin.x) * dir.x + (p.y - origin.y) * dir.y
    if (t < from) from = t
    if (t > to) to = t
  }

  return { origin, dir, normal, offset, from: from - SEGMENT_SLACK, to: to + SEGMENT_SLACK }
}

/** Where the infinite cut line enters and leaves a polygon, along `dir`. */
function chordRange(poly: Pt[], line: CutLine): [number, number] | null {
  const dist = (p: Pt) => line.normal.x * p.x + line.normal.y * p.y - line.offset
  const along = (p: Pt) =>
    (p.x - line.origin.x) * line.dir.x + (p.y - line.origin.y) * line.dir.y

  const hits: number[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const da = dist(a)
    const db = dist(b)
    if (Math.abs(da) < EPS) hits.push(along(a))
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const t = da / (da - db)
      hits.push(along({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }))
    }
  }
  if (hits.length < 2) return null
  const lo = Math.min(...hits)
  const hi = Math.max(...hits)
  return hi - lo < EPS ? null : [lo, hi]
}

/* ---------------------------------------------------------------- *
 * Public operations
 * ---------------------------------------------------------------- */

/**
 * Cut every zone the stroke travels across. Returns `null` when the gesture
 * changed nothing, so callers can tell the user why instead of failing silently.
 */
export function splitZonesByStroke(
  zones: Zone[],
  pts: Pt[],
  opts: { snapStep?: number } = {},
): Zone[] | null {
  if (pts.length < 2 || strokeSpan(pts) < MIN_GESTURE) return null
  const line = fitCutLine(pts, opts)
  if (!line) return null

  const out: Zone[] = []
  let didSplit = false

  for (const zone of zones) {
    // Overlay zones float on top; a cut shouldn't slice them apart.
    if (zone.overlay) {
      out.push(zone)
      continue
    }

    const chord = chordRange(zone.poly, line)
    // The stroke has to actually reach into the part of the zone the line
    // crosses — that is the whole test. No coverage ratio, no minimum length.
    if (!chord || Math.min(line.to, chord[1]) - Math.max(line.from, chord[0]) <= 0) {
      out.push(zone)
      continue
    }

    const near = clipHalfPlane(zone.poly, line.normal, line.offset)
    const far = clipHalfPlane(
      zone.poly,
      { x: -line.normal.x, y: -line.normal.y },
      -line.offset,
    )
    if (!isUsable(near) || !isUsable(far)) {
      out.push(zone)
      continue
    }

    didSplit = true
    // A split zone loses its rounding — the halves are new shapes.
    out.push({ poly: near }, { poly: far })
  }

  return didSplit ? sortZones(out) : null
}

/**
 * Turn the zone the loop was drawn in into a round one, or drop a new round
 * zone on top of it. Returns `null` when the gesture landed nowhere usable.
 */
export function circleZoneByStroke(
  zones: Zone[],
  pts: Pt[],
  opts: { overlay?: boolean } = {},
): Zone[] | null {
  if (pts.length < 3) return null
  const b = polyBBox(pts)
  if (Math.max(b.width, b.height) < MIN_GESTURE) return null

  const centre = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  const target = zoneAtPoint(zones, centre)
  if (target < 0) return null

  const ratio = b.width / Math.max(b.height, EPS)
  const shape: ZoneShape = ratio > 1.3 || ratio < 1 / 1.3 ? 'ellipse' : 'circle'

  if (!opts.overlay) {
    const next = zones.slice()
    next[target] = { ...next[target], shape }
    return next
  }

  // Overlay: clamp the drawn ellipse to the board and float it on top.
  const poly = [
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ].map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) }))
  if (!isUsable(poly)) return null

  return [...zones, { poly, shape, overlay: true }]
}

/** Topmost zone containing a point — overlays win, since they draw on top. */
export function zoneAtPoint(zones: Zone[], p: Pt): number {
  for (let i = zones.length - 1; i >= 0; i--) {
    if (zones[i].overlay && pointInPoly(zones[i].poly, p)) return i
  }
  for (let i = zones.length - 1; i >= 0; i--) {
    if (!zones[i].overlay && pointInPoly(zones[i].poly, p)) return i
  }
  return -1
}

/**
 * Undo one split by tapping a zone: an overlay is simply removed, otherwise the
 * zone is merged into whichever neighbour makes a clean convex shape again.
 * Returns `null` when there is no valid partner.
 */
export function mergeZoneInto(zones: Zone[], index: number): Zone[] | null {
  const a = zones[index]
  if (!a) return null
  if (a.overlay) return sortZones(zones.filter((_, i) => i !== index))

  const areaA = polyArea(a.poly)
  let best = -1
  let bestArea = 0

  for (let i = 0; i < zones.length; i++) {
    if (i === index) continue
    const b = zones[i]
    if (b.overlay) continue
    const hull = convexHull([...a.poly, ...b.poly])
    const hullArea = polyArea(hull)
    // The union is clean exactly when the hull adds no area of its own.
    if (Math.abs(hullArea - (areaA + polyArea(b.poly))) > 1e-6) continue
    if (hullArea > bestArea) {
      bestArea = hullArea
      best = i
    }
  }
  if (best < 0) return null

  const merged: Zone = { poly: convexHull([...a.poly, ...zones[best].poly]) }
  return sortZones([...zones.filter((_, i) => i !== index && i !== best), merged])
}

/** Reading order, with overlays last so they render on top of everything. */
export function sortZones(zones: Zone[]): Zone[] {
  const key = (z: Zone) => {
    const b = polyBBox(z.poly)
    return { y: b.y, x: b.x }
  }
  const rank = (z: Zone) => (z.overlay ? 1 : 0)
  return [...zones].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    const ka = key(a)
    const kb = key(b)
    return Math.abs(ka.y - kb.y) > 1e-6 ? ka.y - kb.y : ka.x - kb.x
  })
}

function isBBoxRect(poly: Pt[], b: BBox): boolean {
  if (poly.length !== 4) return false
  return poly.every(
    (p) =>
      (Math.abs(p.x - b.x) < 1e-6 || Math.abs(p.x - (b.x + b.width)) < 1e-6) &&
      (Math.abs(p.y - b.y) < 1e-6 || Math.abs(p.y - (b.y + b.height)) < 1e-6),
  )
}

/** Project zones onto the `GridCell` model the renderer and storage speak. */
export function zonesToCells(zones: Zone[]): GridCell[] {
  return sortZones(zones).map((z) => {
    const b = polyBBox(z.poly)
    const cell: GridCell = { x: b.x, y: b.y, width: b.width, height: b.height }
    if (z.shape) {
      cell.shape = z.shape
    } else if (!isBBoxRect(z.poly, b)) {
      cell.shape = 'polygon'
      cell.polygon = z.poly.map((p) => ({
        x: b.width > EPS ? (p.x - b.x) / b.width : 0,
        y: b.height > EPS ? (p.y - b.y) / b.height : 0,
      }))
    }
    return cell
  })
}

/** Read layouts saved before zones existed (plain rects and polygons). */
export function cellsToZones(cells: GridCell[]): Zone[] {
  return cells.map((c) => {
    if (c.shape === 'polygon' && c.polygon?.length) {
      return {
        poly: c.polygon.map((p) => ({
          x: c.x + p.x * c.width,
          y: c.y + p.y * c.height,
        })),
      }
    }
    const zone = rectZone(c.x, c.y, c.width, c.height)
    if (c.shape === 'circle' || c.shape === 'ellipse') zone.shape = c.shape
    return zone
  })
}
