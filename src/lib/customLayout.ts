import type { GridCell } from '../types'

export interface DividerLine {
  id: string
  type: 'horizontal' | 'vertical'
  /** Position along the perpendicular axis, normalised 0..1. */
  position: number
  /** Start of the line segment along the parallel axis, normalised 0..1 (defaults to 0). */
  start?: number
  /** End of the line segment along the parallel axis, normalised 0..1 (defaults to 1). */
  end?: number
}

export function spansOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return Math.max(a1, b1) < Math.min(a2, b2)
}

/* ------------------------------------------------------------------ *
 * Freehand splitting
 *
 * The user drags a freehand stroke across the board. The stroke's
 * dominant axis decides whether it is a horizontal or a vertical cut,
 * and every existing cell the stroke meaningfully crosses is split in
 * two at that position. This always yields clean, non-overlapping
 * rectangles (unlike a global line + flood-fill), and one stroke can
 * split several cells at once.
 * ------------------------------------------------------------------ */

export interface Pt {
  x: number
  y: number
}

/** Smallest allowed normalised cell extent — prevents unusable slivers. */
export const MIN_CELL = 0.06

/** Fraction of a cell's span the stroke must cover before it cuts it. */
const CROSS_RATIO = 0.35

export const FULL_CELL: GridCell = { x: 0, y: 0, width: 1, height: 1 }

function overlapLen(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))
}

/** Sort cells reading-order so photo slots get stable, predictable indices. */
export function sortCells(cells: GridCell[]): GridCell[] {
  return [...cells].sort((a, b) => (Math.abs(a.y - b.y) > 1e-6 ? a.y - b.y : a.x - b.x))
}

/**
 * Split `cells` with a freehand stroke given in normalised board coords.
 * Returns a new cell array (input untouched). If the stroke doesn't cross
 * anything usable the original array is returned unchanged.
 */
export function splitCellsByStroke(
  cells: GridCell[],
  pts: Pt[],
  opts: { snapStep?: number } = {},
): GridCell[] {
  if (pts.length < 2) return cells

  const xsAll = pts.map((p) => p.x)
  const ysAll = pts.map((p) => p.y)
  const minX = Math.min(...xsAll)
  const maxX = Math.max(...xsAll)
  const minY = Math.min(...ysAll)
  const maxY = Math.max(...ysAll)

  const dx = maxX - minX
  const dy = maxY - minY
  // Too short to be a deliberate cut.
  if (Math.max(dx, dy) < 0.08) return cells

  // A mostly-horizontal stroke makes a horizontal divider (cuts along Y).
  const horizontal = dx >= dy

  // Cut position = mean of the stroke on the perpendicular axis (robust to
  // wobble), optionally snapped to a grid step.
  const raw = horizontal
    ? ysAll.reduce((s, v) => s + v, 0) / ysAll.length
    : xsAll.reduce((s, v) => s + v, 0) / xsAll.length
  const step = opts.snapStep ?? 0
  const cut = step > 0 ? Math.round(raw / step) * step : raw

  const out: GridCell[] = []
  let didSplit = false

  for (const cell of cells) {
    if (horizontal) {
      const covered = overlapLen(minX, maxX, cell.x, cell.x + cell.width)
      const inside = cut > cell.y + MIN_CELL && cut < cell.y + cell.height - MIN_CELL
      if (!inside || covered < cell.width * CROSS_RATIO) {
        out.push(cell)
        continue
      }
      didSplit = true
      out.push({ x: cell.x, y: cell.y, width: cell.width, height: cut - cell.y })
      out.push({
        x: cell.x,
        y: cut,
        width: cell.width,
        height: cell.y + cell.height - cut,
      })
    } else {
      const covered = overlapLen(minY, maxY, cell.y, cell.y + cell.height)
      const inside = cut > cell.x + MIN_CELL && cut < cell.x + cell.width - MIN_CELL
      if (!inside || covered < cell.height * CROSS_RATIO) {
        out.push(cell)
        continue
      }
      didSplit = true
      out.push({ x: cell.x, y: cell.y, width: cut - cell.x, height: cell.height })
      out.push({
        x: cut,
        y: cell.y,
        width: cell.x + cell.width - cut,
        height: cell.height,
      })
    }
  }

  return didSplit ? sortCells(out) : cells
}

/** Index of the cell containing a normalised point, or -1. */
export function cellAtPoint(cells: GridCell[], p: Pt): number {
  return cells.findIndex(
    (c) => p.x >= c.x && p.x <= c.x + c.width && p.y >= c.y && p.y <= c.y + c.height,
  )
}

/**
 * Merge a cell back into a neighbour sharing a full edge (used to undo a
 * single split by tapping the divider between two zones).
 */
export function mergeCellInto(cells: GridCell[], index: number): GridCell[] {
  const a = cells[index]
  if (!a) return cells
  const eq = (p: number, q: number) => Math.abs(p - q) < 1e-6
  const partner = cells.findIndex((b, i) => {
    if (i === index) return false
    const sameCol = eq(b.x, a.x) && eq(b.width, a.width)
    const sameRow = eq(b.y, a.y) && eq(b.height, a.height)
    if (sameCol && (eq(b.y + b.height, a.y) || eq(a.y + a.height, b.y))) return true
    if (sameRow && (eq(b.x + b.width, a.x) || eq(a.x + a.width, b.x))) return true
    return false
  })
  if (partner < 0) return cells
  const b = cells[partner]
  const merged: GridCell = {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: eq(a.x, b.x) ? a.width : a.width + b.width,
    height: eq(a.y, b.y) ? a.height : a.height + b.height,
  }
  return sortCells([...cells.filter((_, i) => i !== index && i !== partner), merged])
}

/**
 * Compute grid cells from user-drawn divider lines.
 *
 * Algorithm:
 * 1. Build sorted unique coordinates from line endpoints + board edges {0,1}.
 * 2. Sub-divide the unit square into a fine grid using those coordinates.
 * 3. Mark interior edges that are blocked by a divider line.
 * 4. Flood-fill adjacent sub-cells that are NOT separated by a blocked edge.
 * 5. Each connected region becomes one final cell — its bounding box is the
 *    union of the sub-cells in that region.
 */
export function computeCellsFromLines(lines: DividerLine[]): GridCell[] {
  // 1. Collect coordinates
  const xsSet = new Set<number>([0, 1])
  const ysSet = new Set<number>([0, 1])

  for (const line of lines) {
    if (line.type === 'vertical') {
      xsSet.add(line.position)
      const s = line.start ?? 0
      const e = line.end ?? 1
      ysSet.add(s)
      ysSet.add(e)
    } else {
      ysSet.add(line.position)
      const s = line.start ?? 0
      const e = line.end ?? 1
      xsSet.add(s)
      xsSet.add(e)
    }
  }

  const xs = Array.from(xsSet).sort((a, b) => a - b)
  const ys = Array.from(ysSet).sort((a, b) => a - b)

  const xn = xs.length - 1
  const yn = ys.length - 1
  if (xn <= 0 || yn <= 0) {
    return [{ x: 0, y: 0, width: 1, height: 1 }]
  }

  // 2. Build edge blockers
  // vertEdgeBlocked[k][j] = true if edge between column k and k+1 at row j is blocked
  const vertEdgeBlocked: boolean[][] = Array.from({ length: Math.max(0, xn - 1) }, () =>
    Array(yn).fill(false),
  )
  // horizEdgeBlocked[i][k] = true if edge between row k and k+1 at column i is blocked
  const horizEdgeBlocked: boolean[][] = Array.from({ length: xn }, () =>
    Array(Math.max(0, yn - 1)).fill(false),
  )

  for (const line of lines) {
    const s = line.start ?? 0
    const e = line.end ?? 1
    if (line.type === 'vertical') {
      const xi = xs.indexOf(line.position)
      if (xi <= 0 || xi >= xs.length - 1) continue
      for (let j = 0; j < yn; j++) {
        if (spansOverlap(ys[j], ys[j + 1], s, e)) {
          if (vertEdgeBlocked[xi - 1]) {
            vertEdgeBlocked[xi - 1][j] = true
          }
        }
      }
    } else {
      const yi = ys.indexOf(line.position)
      if (yi <= 0 || yi >= ys.length - 1) continue
      for (let i = 0; i < xn; i++) {
        if (spansOverlap(xs[i], xs[i + 1], s, e)) {
          if (horizEdgeBlocked[i]) {
            horizEdgeBlocked[i][yi - 1] = true
          }
        }
      }
    }
  }

  // 4. Flood fill
  const visited = Array.from({ length: xn }, () => Array(yn).fill(false))
  const regions: { i: number; j: number }[][] = []

  for (let i = 0; i < xn; i++) {
    for (let j = 0; j < yn; j++) {
      if (visited[i][j]) continue
      const region: { i: number; j: number }[] = []
      const stack = [{ i, j }]
      visited[i][j] = true

      while (stack.length) {
        const cur = stack.pop()!
        region.push(cur)

        // left
        if (cur.i > 0 && !visited[cur.i - 1][cur.j] && !vertEdgeBlocked[cur.i - 1][cur.j]) {
          visited[cur.i - 1][cur.j] = true
          stack.push({ i: cur.i - 1, j: cur.j })
        }
        // right
        if (cur.i < xn - 1 && !visited[cur.i + 1][cur.j] && !vertEdgeBlocked[cur.i][cur.j]) {
          visited[cur.i + 1][cur.j] = true
          stack.push({ i: cur.i + 1, j: cur.j })
        }
        // up
        if (cur.j > 0 && !visited[cur.i][cur.j - 1] && !horizEdgeBlocked[cur.i][cur.j - 1]) {
          visited[cur.i][cur.j - 1] = true
          stack.push({ i: cur.i, j: cur.j - 1 })
        }
        // down
        if (cur.j < yn - 1 && !visited[cur.i][cur.j + 1] && !horizEdgeBlocked[cur.i][cur.j]) {
          visited[cur.i][cur.j + 1] = true
          stack.push({ i: cur.i, j: cur.j + 1 })
        }
      }

      regions.push(region)
    }
  }

  // 5. Build final cells from region bounding boxes
  return regions.map((region) => {
    let minI = region[0].i,
      maxI = region[0].i
    let minJ = region[0].j,
      maxJ = region[0].j
    for (const r of region) {
      minI = Math.min(minI, r.i)
      maxI = Math.max(maxI, r.i)
      minJ = Math.min(minJ, r.j)
      maxJ = Math.max(maxJ, r.j)
    }
    return {
      x: xs[minI],
      y: ys[minJ],
      width: xs[maxI + 1] - xs[minI],
      height: ys[maxJ + 1] - ys[minJ],
    }
  })
}
