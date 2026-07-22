import { Fragment, useCallback, useRef, useState } from 'react'
import { Group, Line, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import type { GridCell } from '../types'
import type { DividerLine } from '../lib/customLayout'

const SNAP = 0.05

function snap(v: number) {
  return Math.max(0, Math.min(1, Math.round(v / SNAP) * SNAP))
}

interface Props {
  boardWidth: number
  boardHeight: number
  lines: DividerLine[]
  onAddLine: (line: DividerLine) => void
  onRemoveLine: (id: string) => void
  previewCells?: GridCell[]
  tf: { x: number; y: number; scale: number }
  tool: 'horizontal' | 'vertical'
  snapEnabled?: boolean
}

export function CustomLayoutEditor({
  boardWidth,
  boardHeight,
  lines,
  onAddLine,
  onRemoveLine,
  previewCells,
  tf,
  tool,
  snapEnabled = true,
}: Props) {
  const [drawing, setDrawing] = useState(false)
  const [preview, setPreview] = useState<DividerLine | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

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
    if ('touches' in e.evt && e.evt.touches.length !== 1) return
    e.evt.stopPropagation()
    e.evt.preventDefault()
    const pos = getEventPos(e)
    if (!pos) return
    const p = toBoard(pos.x, pos.y)
    const sx = snapEnabled ? snap(p.x / boardWidth) : p.x / boardWidth
    const sy = snapEnabled ? snap(p.y / boardHeight) : p.y / boardHeight
    startRef.current = { x: sx, y: sy }
    setDrawing(true)
    setPreview(null)
  }

  const handleMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.stopPropagation()
    e.evt.preventDefault()
    if (!drawing || !startRef.current) return
    const pos = getEventPos(e)
    if (!pos) return
    const p = toBoard(pos.x, pos.y)
    let ex = p.x / boardWidth
    let ey = p.y / boardHeight
    if (snapEnabled) {
      ex = snap(ex)
      ey = snap(ey)
    }
    const sx = startRef.current.x
    const sy = startRef.current.y

    if (tool === 'horizontal') {
      if (Math.abs(ex - sx) < 0.001) {
        setPreview(null)
        return
      }
      setPreview({
        id: 'preview',
        type: 'horizontal',
        position: sy,
        start: Math.min(sx, ex),
        end: Math.max(sx, ex),
      })
    } else {
      if (Math.abs(ey - sy) < 0.001) {
        setPreview(null)
        return
      }
      setPreview({
        id: 'preview',
        type: 'vertical',
        position: sx,
        start: Math.min(sy, ey),
        end: Math.max(sy, ey),
      })
    }
  }

  const handleEnd = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.evt.stopPropagation()
    if (!drawing) return
    if ('touches' in e.evt && e.evt.touches.length > 0) return
    setDrawing(false)
    if (
      preview &&
      preview.start !== undefined &&
      preview.end !== undefined &&
      preview.end > preview.start
    ) {
      const line: DividerLine = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        type: preview.type,
        position: preview.position,
        start: preview.start,
        end: preview.end,
      }
      onAddLine(line)
    }
    setPreview(null)
    startRef.current = null
  }

  const dots: { x: number; y: number }[] = []
  for (let xi = 0; xi <= 20; xi++) {
    for (let yi = 0; yi <= 20; yi++) {
      dots.push({ x: xi * 0.05 * boardWidth, y: yi * 0.05 * boardHeight })
    }
  }

  return (
    <Group>
      {/* Snap grid dots */}
      {dots.map((d, i) => (
        <Line
          key={`dot-${i}`}
          points={[d.x, d.y, d.x + 0.1, d.y + 0.1]}
          stroke="rgba(100,100,100,0.2)"
          strokeWidth={2}
          lineCap="round"
          listening={false}
        />
      ))}
      {/* Drawing surface */}
      <Rect
        width={boardWidth}
        height={boardHeight}
        fill="transparent"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      {/* Committed lines */}
      {lines.map((line) => {
        if (line.type === 'horizontal') {
          const y = line.position * boardHeight
          const x1 = (line.start ?? 0) * boardWidth
          const x2 = (line.end ?? 1) * boardWidth
          return (
            <Line
              key={line.id}
              points={[x1, y, x2, y]}
              stroke="#6366f1"
              strokeWidth={3}
              lineCap="round"
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={4}
              onTap={(e) => {
                e.evt.stopPropagation()
                onRemoveLine(line.id)
              }}
              onClick={(e) => {
                e.evt.stopPropagation()
                onRemoveLine(line.id)
              }}
              hitStrokeWidth={12}
            />
          )
        } else {
          const x = line.position * boardWidth
          const y1 = (line.start ?? 0) * boardHeight
          const y2 = (line.end ?? 1) * boardHeight
          return (
            <Line
              key={line.id}
              points={[x, y1, x, y2]}
              stroke="#ec4899"
              strokeWidth={3}
              lineCap="round"
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={4}
              onTap={(e) => {
                e.evt.stopPropagation()
                onRemoveLine(line.id)
              }}
              onClick={(e) => {
                e.evt.stopPropagation()
                onRemoveLine(line.id)
              }}
              hitStrokeWidth={12}
            />
          )
        }
      })}
      {/* Preview line */}
      {preview && (
        <Line
          points={
            preview.type === 'horizontal'
              ? [
                  (preview.start ?? 0) * boardWidth,
                  preview.position * boardHeight,
                  (preview.end ?? 1) * boardWidth,
                  preview.position * boardHeight,
                ]
              : [
                  preview.position * boardWidth,
                  (preview.start ?? 0) * boardHeight,
                  preview.position * boardWidth,
                  (preview.end ?? 1) * boardHeight,
                ]
          }
          stroke="rgba(255,255,255,0.8)"
          strokeWidth={2}
          dash={[6, 4]}
          lineCap="round"
          listening={false}
        />
      )}
      {/* Preview cells */}
      {previewCells?.map((cell, i) => (
        <Fragment key={`cell-frag-${i}`}>
          <Rect
            x={cell.x * boardWidth}
            y={cell.y * boardHeight}
            width={cell.width * boardWidth}
            height={cell.height * boardHeight}
            stroke="#22c55e"
            strokeWidth={2}
            dash={[8, 4]}
            listening={false}
          />
          <KonvaText
            x={cell.x * boardWidth + 8}
            y={cell.y * boardHeight + 8}
            text={String(i + 1)}
            fill="#22c55e"
            fontSize={16}
            fontFamily="Poppins, system-ui, sans-serif"
            listening={false}
          />
        </Fragment>
      ))}
    </Group>
  )
}
