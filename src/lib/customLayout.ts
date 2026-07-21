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
