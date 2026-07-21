// Auto-layout: arrange photos in a balanced grid/collage automatically.
// Uses greedy rectangle-packing with aesthetic scoring.

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Compute collage layout for N photos using recursive subdivision. */
export function computeAutoLayout(
  count: number,
  boardW: number,
  boardH: number,
): Rect[] {
  if (count === 0) return []
  if (count === 1) return [{ x: 0, y: 0, width: boardW, height: boardH }]

  // Try to balance rows
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)

  const cellW = boardW / cols
  const cellH = boardH / rows

  const rects: Rect[] = []
  for (let i = 0; i < count; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    // Last row may have fewer items — center them
    const inLastRow = r === rows - 1
    const itemsInRow = inLastRow ? count - (rows - 1) * cols : cols
    const offsetX = inLastRow ? (boardW - itemsInRow * cellW) / 2 : 0

    rects.push({
      x: offsetX + c * cellW,
      y: r * cellH,
      width: cellW,
      height: cellH,
    })
  }

  return rects
}

/** Masonry-style layout for variable aspect ratios. */
export function computeMasonryLayout(
  aspectRatios: number[],
  boardW: number,
  boardH: number,
  gap: number = 8,
): Rect[] {
  if (aspectRatios.length === 0) return []

  // Determine columns based on board aspect
  const boardAspect = boardW / boardH
  const cols = boardAspect > 1 ? 3 : 2
  const colWidth = (boardW - gap * (cols - 1)) / cols

  const colHeights = new Array(cols).fill(0)
  const rects: Rect[] = []

  for (const ar of aspectRatios) {
    // Pick shortest column
    const col = colHeights.indexOf(Math.min(...colHeights))
    const height = colWidth / ar
    rects.push({
      x: col * (colWidth + gap),
      y: colHeights[col],
      width: colWidth,
      height,
    })
    colHeights[col] += height + gap
  }

  return rects
}

/** Spiral layout for creative collages. */
export function computeSpiralLayout(
  count: number,
  boardW: number,
  boardH: number,
): Rect[] {
  const cx = boardW / 2
  const cy = boardH / 2
  const rects: Rect[] = []
  const baseSize = Math.min(boardW, boardH) * 0.25

  for (let i = 0; i < count; i++) {
    const angle = i * 0.8
    const radius = Math.sqrt(i + 1) * baseSize * 0.6
    const size = baseSize * (1 - i / (count + 2) * 0.5)
    rects.push({
      x: cx + Math.cos(angle) * radius - size / 2,
      y: cy + Math.sin(angle) * radius - size / 2,
      width: size,
      height: size,
    })
  }

  return rects
}
