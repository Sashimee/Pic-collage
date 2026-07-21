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
const CENTER_WEIGHT = 0.5 // slightly prefer center snaps

function getBounds(el: CanvasElement) {
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

/** Compute snapped position and visible guides for a dragged element. */
export function computeSnap(
  dragged: CanvasElement,
  allElements: CanvasElement[],
  boardW: number,
  boardH: number,
  currentX: number,
  currentY: number,
): SnapResult {
  const others = allElements.filter((e) => e.id !== dragged.id && !e.hidden)
  const db = getBounds({ ...dragged, x: currentX, y: currentY })

  const targets: { axis: 'x' | 'y'; pos: number; snapPos: number; weight: number }[] = []

  // Board edges + center
  targets.push(
    { axis: 'x', pos: 0, snapPos: db.left, weight: 1 },
    { axis: 'x', pos: boardW / 2, snapPos: db.cx, weight: CENTER_WEIGHT },
    { axis: 'x', pos: boardW, snapPos: db.right, weight: 1 },
    { axis: 'y', pos: 0, snapPos: db.top, weight: 1 },
    { axis: 'y', pos: boardH / 2, snapPos: db.cy, weight: CENTER_WEIGHT },
    { axis: 'y', pos: boardH, snapPos: db.bottom, weight: 1 },
  )

  // Other elements
  for (const el of others) {
    const b = getBounds(el)
    // Horizontal snaps
    targets.push(
      { axis: 'x', pos: b.left, snapPos: db.left, weight: 1 },
      { axis: 'x', pos: b.cx, snapPos: db.cx, weight: CENTER_WEIGHT },
      { axis: 'x', pos: b.right, snapPos: db.right, weight: 1 },
      // Equal spacing: snap right edge to same distance from next element
    )
    // Vertical snaps
    targets.push(
      { axis: 'y', pos: b.top, snapPos: db.top, weight: 1 },
      { axis: 'y', pos: b.cy, snapPos: db.cy, weight: CENTER_WEIGHT },
      { axis: 'y', pos: b.bottom, snapPos: db.bottom, weight: 1 },
    )
  }

  let snapX = currentX
  let snapY = currentY
  let bestDx = Infinity
  let bestDy = Infinity
  const guides: SnapLine[] = []

  for (const t of targets) {
    const diff = t.pos - t.snapPos
    if (t.axis === 'x') {
      const absDiff = Math.abs(diff)
      if (absDiff < THRESHOLD && absDiff < Math.abs(bestDx)) {
        bestDx = diff
        snapX = currentX + diff
      }
    } else {
      const absDiff = Math.abs(diff)
      if (absDiff < THRESHOLD && absDiff < Math.abs(bestDy)) {
        bestDy = diff
        snapY = currentY + diff
      }
    }
  }

  // Build guides for the winning snaps
  if (Math.abs(bestDx) < THRESHOLD) {
    // Find all elements/board edges that align at this snapX
    const alignX = getBounds({ ...dragged, x: snapX, y: snapY }).cx // use center as ref
    for (const el of others) {
      const b = getBounds(el)
      if (Math.abs(b.cx - alignX) < 1) {
        guides.push({ axis: 'x', pos: alignX, from: Math.min(b.top, db.top), to: Math.max(b.bottom, db.bottom) })
      }
    }
    // Always show center guide if snapping to board center
    if (Math.abs(boardW / 2 - alignX) < 1) {
      guides.push({ axis: 'x', pos: boardW / 2, from: 0, to: boardH })
    }
    // If snapping to edge
    if (Math.abs(alignX) < 1 || Math.abs(alignX - boardW) < 1) {
      guides.push({ axis: 'x', pos: alignX < 1 ? 0 : boardW, from: 0, to: boardH })
    }
  }

  if (Math.abs(bestDy) < THRESHOLD) {
    const alignY = getBounds({ ...dragged, x: snapX, y: snapY }).cy
    for (const el of others) {
      const b = getBounds(el)
      if (Math.abs(b.cy - alignY) < 1) {
        guides.push({ axis: 'y', pos: alignY, from: Math.min(b.left, db.left), to: Math.max(b.right, db.right) })
      }
    }
    if (Math.abs(boardH / 2 - alignY) < 1) {
      guides.push({ axis: 'y', pos: boardH / 2, from: 0, to: boardW })
    }
    if (Math.abs(alignY) < 1 || Math.abs(alignY - boardH) < 1) {
      guides.push({ axis: 'y', pos: alignY < 1 ? 0 : boardH, from: 0, to: boardW })
    }
  }

  return { x: snapX, y: snapY, guides }
}
