import { Fragment, useCallback, useRef, useState } from 'react'
import { Group, Line, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import type { GridCell } from '../types'
import { cellAtPoint, type Pt } from '../lib/customLayout'

/** Snap grid step in normalised board units. */
const SNAP_STEP = 0.05

interface Props {
  boardWidth: number
  boardHeight: number
  /** Current zones (normalised). */
  cells: GridCell[]
  /** Preview gap in board px so zones read exactly like a real layout. */
  gap: number
  radius: number
  onStroke: (pts: Pt[]) => void
  onTapCell: (index: number) => void
  tf: { x: number; y: number; scale: number }
  snapEnabled?: boolean
}

export function CustomLayoutEditor({
  boardWidth,
  boardHeight,
  cells,
  gap,
  radius,
  onStroke,
  onTapCell,
  tf,
  snapEnabled = true,
}: Props) {
  // Live stroke points in BOARD pixels (for rendering).
  const [stroke, setStroke] = useState<number[]>([])
  const drawing = useRef(false)
  const ptsRef = useRef<Pt[]>([])

  const toBoard = useCallback(
    (px: number, py: number) => ({
      x: (px - tf.x) / tf.scale,
      y: (py - tf.y) / tf.scale,
    }),
    [tf],
  )

  const getEventPos = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage()
      if (!stage) return null
      if ('touches' in e.evt && e.evt.touches.length > 0) {
        const rect = stage.container().getBoundingClientRect()
        const t = e.evt.touches[0]
        return { x: t.clientX - rect.left, y: t.clientY - rect.top }
      }
      return stage.getPointerPosition()
    },
    [],
  )

  const handleStart = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Let two-finger gestures fall through to the stage (pinch/zoom).
    if ('touches' in e.evt && e.evt.touches.length !== 1) return
    e.evt.preventDefault()
    e.cancelBubble = true
    const pos = getEventPos(e)
    if (!pos) return
    const b = toBoard(pos.x, pos.y)
    drawing.current = true
    ptsRef.current = [{ x: b.x / boardWidth, y: b.y / boardHeight }]
    setStroke([b.x, b.y])
  }

  const handleMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawing.current) return
    if ('touches' in e.evt && e.evt.touches.length !== 1) return
    e.evt.preventDefault()
    e.cancelBubble = true
    const pos = getEventPos(e)
    if (!pos) return
    const b = toBoard(pos.x, pos.y)
    ptsRef.current.push({ x: b.x / boardWidth, y: b.y / boardHeight })
    setStroke((s) => [...s, b.x, b.y])
  }

  const handleEnd = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawing.current) return
    e.cancelBubble = true
    drawing.current = false
    const pts = ptsRef.current
    ptsRef.current = []
    setStroke([])

    if (pts.length < 1) return

    // Distinguish a tap (merge two zones back together) from a drag (cut).
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const span = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
    )
    if (span < 0.03) {
      const idx = cellAtPoint(cells, pts[0])
      if (idx >= 0) onTapCell(idx)
      return
    }

    onStroke(pts)
  }

  // Snap-grid dots (visual aid only).
  const dots: { x: number; y: number }[] = []
  if (snapEnabled) {
    const n = Math.round(1 / SNAP_STEP)
    for (let xi = 0; xi <= n; xi++) {
      for (let yi = 0; yi <= n; yi++) {
        dots.push({ x: xi * SNAP_STEP * boardWidth, y: yi * SNAP_STEP * boardHeight })
      }
    }
  }

  return (
    <Group>
      {/* Snap grid dots */}
      {dots.map((d, i) => (
        <Line
          key={`dot-${i}`}
          points={[d.x, d.y, d.x + 0.1, d.y + 0.1]}
          stroke="rgba(120,120,120,0.22)"
          strokeWidth={2}
          lineCap="round"
          listening={false}
        />
      ))}

      {/* Zones — rendered with the SAME gap/radius the finished layout uses,
          so what you draw is exactly what you get. */}
      {cells.map((cell, i) => {
        const x = cell.x * boardWidth + gap / 2
        const y = cell.y * boardHeight + gap / 2
        const w = cell.width * boardWidth - gap
        const h = cell.height * boardHeight - gap
        return (
          <Fragment key={`zone-${i}`}>
            <Rect
              x={x}
              y={y}
              width={Math.max(1, w)}
              height={Math.max(1, h)}
              cornerRadius={radius}
              fill="rgba(99,102,241,0.10)"
              stroke="#6366f1"
              strokeWidth={2}
              listening={false}
            />
            <KonvaText
              x={x + 10}
              y={y + 8}
              text={String(i + 1)}
              fill="#6366f1"
              fontSize={Math.max(14, Math.min(w, h) * 0.14)}
              fontStyle="bold"
              fontFamily="Poppins, system-ui, sans-serif"
              listening={false}
            />
          </Fragment>
        )
      })}

      {/* Drawing surface — on top so strokes always land here. */}
      <Rect
        width={boardWidth}
        height={boardHeight}
        fill="transparent"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Live freehand stroke */}
      {stroke.length >= 4 && (
        <Line
          points={stroke}
          stroke="#ec4899"
          strokeWidth={4 / tf.scale + 2}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
          dash={[10, 6]}
          listening={false}
        />
      )}
    </Group>
  )
}
