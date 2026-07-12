import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Group, Layer, Stage, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditor } from '../store/editorStore'
import { getGridById } from '../lib/grids'
import { Background } from './Background'
import { ElementNode } from './CanvasNodes'
import { GridView } from './GridView'
import { exportBoard, type ExportFormat } from '../lib/exportImage'
import { useT } from '../i18n/useLang'
import type { CanvasElement, PhotoElement } from '../types'

export interface EditorHandle {
  exportImage: (format: ExportFormat) => string | null
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

export const EditorCanvas = forwardRef<EditorHandle>((_props, ref) => {
  const t = useT()
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const boardRef = useRef<Konva.Group>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const [size, setSize] = useState({ w: 0, h: 0 })
  const [tf, setTf] = useState({ x: 0, y: 0, scale: 1 })

  const boardWidth = useEditor((s) => s.boardWidth)
  const boardHeight = useEditor((s) => s.boardHeight)
  const background = useEditor((s) => s.background)
  const elements = useEditor((s) => s.elements)
  const mode = useEditor((s) => s.mode)
  const gridId = useEditor((s) => s.gridId)
  const gridGap = useEditor((s) => s.gridGap)
  const gridRadius = useEditor((s) => s.gridRadius)
  const selectedId = useEditor((s) => s.selectedId)
  const select = useEditor((s) => s.select)
  const updateElement = useEditor((s) => s.updateElement)

  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null)

  // --- responsive board sizing -------------------------------------------
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const ro = new ResizeObserver(() => {
      setSize({ w: host.clientWidth, h: host.clientHeight })
    })
    ro.observe(host)
    setSize({ w: host.clientWidth, h: host.clientHeight })
    return () => ro.disconnect()
  }, [])

  const fitToScreen = () => {
    if (!size.w || !size.h) return
    const scale = Math.min(size.w / boardWidth, size.h / boardHeight) * 0.92
    setTf({
      x: (size.w - boardWidth * scale) / 2,
      y: (size.h - boardHeight * scale) / 2,
      scale,
    })
  }

  // Re-fit when the viewport or board dimensions change.
  useEffect(fitToScreen, [size.w, size.h, boardWidth, boardHeight])

  // --- transformer attachment --------------------------------------------
  // Attach to the selected element when it is rendered as a free node: any
  // element in free mode, only non-photo overlays in grid mode (grid photos
  // keep the tap-highlight from GridView, without transform handles).
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const sel = selectedId
      ? elements.find((e) => e.id === selectedId)
      : undefined
    const attachable = !!sel && (mode !== 'grid' || sel.type !== 'photo')
    const node = attachable ? stage.findOne('#' + selectedId) : undefined
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, mode, elements])

  // --- export handle ------------------------------------------------------
  useImperativeHandle(ref, () => ({
    exportImage: (format) => {
      const board = boardRef.current
      if (!board) return null
      return exportBoard(board, boardWidth, boardHeight, format)
    },
  }))

  // --- gestures -----------------------------------------------------------
  const zoomAtPoint = (px: number, py: number, factor: number) => {
    setTf((prev) => {
      const newScale = clamp(prev.scale * factor, 0.2, 6)
      const pointTo = { x: (px - prev.x) / prev.scale, y: (py - prev.y) / prev.scale }
      return {
        scale: newScale,
        x: px - pointTo.x * newScale,
        y: py - pointTo.y * newScale,
      }
    })
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const p = stage?.getPointerPosition()
    if (!p) return
    zoomAtPoint(p.x, p.y, e.evt.deltaY > 0 ? 1 / 1.06 : 1.06)
  }

  const localPoint = (t: Touch) => {
    const rect = stageRef.current?.container().getBoundingClientRect()
    return { x: t.clientX - (rect?.left ?? 0), y: t.clientY - (rect?.top ?? 0) }
  }

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length !== 2) return
    e.evt.preventDefault()
    const p1 = localPoint(touches[0])
    const p2 = localPoint(touches[1])
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2
    const prev = pinch.current
    if (prev) {
      setTf((t) => {
        const factor = clamp(dist / prev.dist, 0.5, 2)
        const newScale = clamp(t.scale * factor, 0.2, 6)
        const pointTo = { x: (cx - t.x) / t.scale, y: (cy - t.y) / t.scale }
        return {
          scale: newScale,
          x: cx - pointTo.x * newScale + (cx - prev.cx),
          y: cy - pointTo.y * newScale + (cy - prev.cy),
        }
      })
    }
    pinch.current = { dist, cx, cy }
  }

  const endPinch = () => {
    pinch.current = null
  }

  // Click on empty space / background → clear selection.
  const handlePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const target = e.target
    if (target === target.getStage() || target.name() === 'background') {
      select(null)
    }
  }

  const gridLayout = gridId ? getGridById(gridId) : undefined
  const photos = elements.filter((e): e is PhotoElement => e.type === 'photo')
  const inGrid = mode === 'grid' && !!gridLayout
  // In grid mode photos fill the cells; text/stickers float on top as free nodes.
  const freeElements = inGrid
    ? elements.filter((e) => e.type !== 'photo')
    : elements

  const renderElement = (el: CanvasElement) => (
    <ElementNode
      key={el.id}
      el={el}
      onSelect={() => select(el.id)}
      onChange={(patch) => updateElement(el.id, patch)}
      onEditText={(id) => {
        const current = useEditor.getState().elements.find((x) => x.id === id)
        if (current?.type !== 'text') return
        const next = window.prompt(t('canvas.editText'), current.text)
        if (next != null) updateElement(id, { text: next })
      }}
    />
  )

  return (
    <div ref={hostRef} className="canvas-host relative h-full w-full">
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={endPinch}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <Layer>
            <Group ref={boardRef} x={tf.x} y={tf.y} scaleX={tf.scale} scaleY={tf.scale}>
              <Background bg={background} width={boardWidth} height={boardHeight} />
              {inGrid && gridLayout && (
                <GridView
                  layout={gridLayout}
                  photos={photos}
                  width={boardWidth}
                  height={boardHeight}
                  gap={gridGap}
                  radius={gridRadius}
                  selectedId={selectedId}
                  onSelect={select}
                />
              )}
              {freeElements.map(renderElement)}
            </Group>
            <Transformer
              ref={trRef}
              rotateEnabled
              anchorSize={16}
              anchorCornerRadius={8}
              anchorStroke="#6366f1"
              borderStroke="#6366f1"
              borderStrokeWidth={2}
              rotateAnchorOffset={34}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      )}
    </div>
  )
})

EditorCanvas.displayName = 'EditorCanvas'
