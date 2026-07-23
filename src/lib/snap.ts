import type { CanvasElement } from '../types'

export interface SnapLine {
  axis: 'x' | 'y'
  pos: number
  from: number
  to: number
}

export interface SnapResult {
  x: number
  y: number
  guides: SnapLine[]
}

const THRESHOLD = 12 // design units

interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
  cx: number
  cy: number
  width: number
  height: number
}

function getBounds(el: CanvasElement): Bounds {
  const w = getWidth(el)
  const h = getHeight(el)
  return {
    left: el.x,
    right: el.x + w * el.scaleX,
    top: el.y,
    bottom: el.y + h * el.scaleY,
    cx: el.x + (w * el.scaleX) / 2,
    cy: el.y + (h * el.scaleY) / 2,
    width: w * el.scaleX,
    height: h * el.scaleY,
  }
}

function getWidth(el: CanvasElement): number {
  if (el.type === 'photo') return el.width
  if (el.type === 'text') {
    // Approximate width: fontSize * text.length * 0.6, or use explicit width
    return el.width ?? el.fontSize * el.text.length * 0.6
  }
  if (el.type === 'sticker') return el.fontSize
  if (el.type === 'drawing') {
    const xs = el.points.filter((_, i) => i % 2 === 0)
    return Math.max(...xs) - Math.min(...xs)
  }
  if (el.type === 'shape') {
    if (el.shapeType === 'arrow') return 120
    if (el.shapeType === 'star' || el.shapeType === 'triangle') return 120
    if (el.shapeType === 'circle') return 100
    return 120 // rect default
  }
  return 100
}

function getHeight(el: CanvasElement): number {
  if (el.type === 'photo') return el.height
  if (el.type === 'text') {
    const lines = el.text.split('\n').length
    return (el.fontSize * (el.lineHeight ?? 1.2)) * Math.max(lines, 1)
  }
  if (el.type === 'sticker') return el.fontSize
  if (el.type === 'drawing') {
    const ys = el.points.filter((_, i) => i % 2 === 1)
    return Math.max(...ys) - Math.min(...ys)
  }
  if (el.type === 'shape') {
    if (el.shapeType === 'arrow') return 12 // thin
    if (el.shapeType === 'star' || el.shapeType === 'triangle') return 120
    if (el.shapeType === 'circle') return 100
    return 80 // rect default
  }
  return 100
}

// A candidate alignment. `pos` is where the red guide line is drawn; `feature`
// is the dragged element's current coordinate that should move onto `pos`
// (so the applied delta is `pos - feature`). `ref` bounds (a neighbour, or the
// two neighbours of an equal-spacing snap) drive the guide's length; `undefined`
// means a board edge/centre → the guide spans the whole board.
interface AxisTarget {
  pos: number
  feature: number
  refs: Bounds[]
}

/** Compute snapped position and visible guides for a dragged element. */
export function computeSnap(
  dragged: CanvasElement,
  allElements: CanvasElement[],
  boardW: number,
  boardH: number,
  currentX: number,
  currentY: number,
): SnapResult {
  const others = allElements
    .filter((e) => e.id !== dragged.id && !e.hidden)
    .map(getBounds)
  const db = getBounds({ ...dragged, x: currentX, y: currentY })

  const xTargets: AxisTarget[] = []
  const yTargets: AxisTarget[] = []

  // Board edges + centre (guide spans the whole board → no refs).
  xTargets.push(
    { pos: 0, feature: db.left, refs: [] },
    { pos: boardW / 2, feature: db.cx, refs: [] },
    { pos: boardW, feature: db.right, refs: [] },
  )
  yTargets.push(
    { pos: 0, feature: db.top, refs: [] },
    { pos: boardH / 2, feature: db.cy, refs: [] },
    { pos: boardH, feature: db.bottom, refs: [] },
  )

  for (const b of others) {
    // Edge/centre alignment (left↔left, centre↔centre, right↔right, …).
    xTargets.push(
      { pos: b.left, feature: db.left, refs: [b] },
      { pos: b.cx, feature: db.cx, refs: [b] },
      { pos: b.right, feature: db.right, refs: [b] },
      // Adjacency: place the dragged element beside its neighbour.
      { pos: b.left, feature: db.right, refs: [b] },
      { pos: b.right, feature: db.left, refs: [b] },
    )
    yTargets.push(
      { pos: b.top, feature: db.top, refs: [b] },
      { pos: b.cy, feature: db.cy, refs: [b] },
      { pos: b.bottom, feature: db.bottom, refs: [b] },
      { pos: b.top, feature: db.bottom, refs: [b] },
      { pos: b.bottom, feature: db.top, refs: [b] },
    )
  }

  // Equal spacing: centre the dragged element between any pair of neighbours.
  for (let i = 0; i < others.length; i++) {
    for (let j = i + 1; j < others.length; j++) {
      const a = others[i]
      const b = others[j]
      xTargets.push({ pos: (a.cx + b.cx) / 2, feature: db.cx, refs: [a, b] })
      yTargets.push({ pos: (a.cy + b.cy) / 2, feature: db.cy, refs: [a, b] })
    }
  }

  const pickBest = (targets: AxisTarget[]): AxisTarget | null => {
    let best: AxisTarget | null = null
    let bestAbs = THRESHOLD
    for (const t of targets) {
      const abs = Math.abs(t.pos - t.feature)
      if (abs < bestAbs) {
        bestAbs = abs
        best = t
      }
    }
    return best
  }

  const bestX = pickBest(xTargets)
  const bestY = pickBest(yTargets)

  const snapX = bestX ? currentX + (bestX.pos - bestX.feature) : currentX
  const snapY = bestY ? currentY + (bestY.pos - bestY.feature) : currentY

  // Guides are drawn against the snapped bounds so their extent hugs the element.
  const snapped = getBounds({ ...dragged, x: snapX, y: snapY })
  const guides: SnapLine[] = []

  if (bestX) {
    if (bestX.refs.length) {
      const tops = [snapped.top, ...bestX.refs.map((r) => r.top)]
      const bottoms = [snapped.bottom, ...bestX.refs.map((r) => r.bottom)]
      guides.push({ axis: 'x', pos: bestX.pos, from: Math.min(...tops), to: Math.max(...bottoms) })
    } else {
      guides.push({ axis: 'x', pos: bestX.pos, from: 0, to: boardH })
    }
  }
  if (bestY) {
    if (bestY.refs.length) {
      const lefts = [snapped.left, ...bestY.refs.map((r) => r.left)]
      const rights = [snapped.right, ...bestY.refs.map((r) => r.right)]
      guides.push({ axis: 'y', pos: bestY.pos, from: Math.min(...lefts), to: Math.max(...rights) })
    } else {
      guides.push({ axis: 'y', pos: bestY.pos, from: 0, to: boardW })
    }
  }

  return { x: snapX, y: snapY, guides }
}
