import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Ellipse, Group, Line, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import {
  MIN_GESTURE,
  polyBBox,
  zoneAtPoint,
  type Pt,
  type Zone,
} from '../lib/customLayout'

/** Snap grid step in normalised board units. */
export const SNAP_STEP = 0.05

export type LayoutTool = 'cut' | 'circle'

interface Props {
  boardWidth: number
  boardHeight: number
  /** Current zones (normalised). */
  zones: Zone[]
  /** Preview gap in board px so zones read exactly like a real layout. */
  gap: number
  tool: LayoutTool
  onStroke: (pts: Pt[]) => void
  onTapZone: (index: number) => void
  tf: { x: number; y: number; scale: number }
  snapEnabled?: boolean
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export function CustomLayoutEditor({
  boardWidth,
  boardHeight,
  zones,
  gap,
  tool,
  onStroke,
  onTapZone,
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

  const getEventPos = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return null
    if ('touches' in e.evt && e.evt.touches.length > 0) {
      const rect = stage.container().getBoundingClientRect()
      const t = e.evt.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return stage.getPointerPosition()
  }, [])

  const commit = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    const pts = ptsRef.current
    ptsRef.current = []
    setStroke([])
    if (!pts.length) return

    // A tap (rather than a drag) merges the zone back into a neighbour.
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const span = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
    )
    if (span < MIN_GESTURE) {
      const idx = zoneAtPoint(zones, pts[0])
      if (idx >= 0) onTapZone(idx)
      return
    }
    onStroke(pts)
  }, [zones, onStroke, onTapZone])

  // A gesture that ends off-canvas (or is cancelled by the OS) must still
  // commit — the board-sized hit target used to swallow those silently, which
  // is why most strokes appeared to do nothing at all.
  const commitRef = useRef(commit)
  commitRef.current = commit
  useEffect(() => {
    const end = () => commitRef.current()
    window.addEventListener('pointerup', end)
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', end)
    }
  }, [])

  const push = (px: number, py: number) => {
    const b = toBoard(px, py)
    ptsRef.current.push({
      x: clamp01(b.x / boardWidth),
      y: clamp01(b.y / boardHeight),
    })
    setStroke((s) => [...s, b.x, b.y])
  }

  const handleStart = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Let two-finger gestures fall through to the stage (pinch/zoom).
    if ('touches' in e.evt && e.evt.touches.length !== 1) return
    e.evt.preventDefault()
    e.cancelBubble = true
    const pos = getEventPos(e)
    if (!pos) return
    drawing.current = true
    ptsRef.current = []
    setStroke([])
    push(pos.x, pos.y)
  }

  const handleMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawing.current) return
    if ('touches' in e.evt && e.evt.touches.length !== 1) return
    e.evt.preventDefault()
    e.cancelBubble = true
    const pos = getEventPos(e)
    if (!pos) return
    push(pos.x, pos.y)
  }

  const handleEnd = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!drawing.current) return
    e.cancelBubble = true
    commit()
  }

  // Snap-grid dots (visual aid only).
  const dots: { x: number; y: number }[] = []
  if (snapEnabled && tool === 'cut') {
    const n = Math.round(1 / SNAP_STEP)
    for (let xi = 0; xi <= n; xi++) {
      for (let yi = 0; yi <= n; yi++) {
        dots.push({ x: xi * SNAP_STEP * boardWidth, y: yi * SNAP_STEP * boardHeight })
      }
    }
  }

  // Live circle preview comes from the stroke's bounding box.
  const strokeBBox = (() => {
    if (tool !== 'circle' || stroke.length < 6) return null
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < stroke.length; i += 2) {
      xs.push(stroke[i])
      ys.push(stroke[i + 1])
    }
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
  })()

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

      {/* Zones — rendered with the SAME gap/radius/shape the finished layout
          uses, so what you draw is exactly what you get. */}
      {zones.map((zone, i) => {
        const b = polyBBox(zone.poly)
        const x = b.x * boardWidth + gap / 2
        const y = b.y * boardHeight + gap / 2
        const w = Math.max(1, b.width * boardWidth - gap)
        const h = Math.max(1, b.height * boardHeight - gap)
        const fill = zone.overlay ? 'rgba(236,72,153,0.16)' : 'rgba(99,102,241,0.10)'
        const line = zone.overlay ? '#ec4899' : '#6366f1'
        return (
          <Fragment key={`zone-${i}`}>
            {/* The zone's real extent, always — a round zone still occupies its
                whole box, and hiding that makes the layout unreadable. */}
            <Line
              points={zone.poly.flatMap((p) => [p.x * boardWidth, p.y * boardHeight])}
              closed
              fill={zone.shape ? undefined : fill}
              stroke={line}
              strokeWidth={2}
              dash={zone.shape ? [10, 8] : undefined}
              opacity={zone.shape ? 0.5 : 1}
              shadowForStrokeEnabled={false}
              listening={false}
            />
            {zone.shape && (
              <Ellipse
                x={x + w / 2}
                y={y + h / 2}
                radiusX={zone.shape === 'circle' ? Math.min(w, h) / 2 : w / 2}
                radiusY={zone.shape === 'circle' ? Math.min(w, h) / 2 : h / 2}
                fill={fill}
                stroke={line}
                strokeWidth={2}
                listening={false}
              />
            )}
            <KonvaText
              x={x + 10}
              y={y + 8}
              text={String(i + 1)}
              fill={line}
              fontSize={Math.max(14, Math.min(w, h) * 0.14)}
              fontStyle="bold"
              fontFamily="Poppins, system-ui, sans-serif"
              listening={false}
            />
          </Fragment>
        )
      })}

      {/* Drawing surface — deliberately far larger than the board so a stroke
          that starts or ends past the edge (the natural way to cut the whole
          board) is still captured. Points are clamped to the board. */}
      <Rect
        x={-boardWidth}
        y={-boardHeight}
        width={boardWidth * 3}
        height={boardHeight * 3}
        fill="transparent"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Live gesture preview */}
      {tool === 'cut' && stroke.length >= 4 && (
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
      {strokeBBox && (
        <Ellipse
          x={strokeBBox.x + strokeBBox.width / 2}
          y={strokeBBox.y + strokeBBox.height / 2}
          radiusX={Math.max(1, strokeBBox.width / 2)}
          radiusY={Math.max(1, strokeBBox.height / 2)}
          stroke="#ec4899"
          strokeWidth={4 / tf.scale + 2}
          dash={[10, 6]}
          listening={false}
        />
      )}
    </Group>
  )
}
