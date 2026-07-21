import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Group,
  Image as KonvaImage,
  Line,
  Path,
  Rect,
  RegularPolygon,
  Star,
  Text as KonvaText,
  TextPath,
  Arrow,
} from 'react-konva'
import type Konva from 'konva'
import type {
  CanvasElement,
  DrawingElement,
  PhotoElement,
  ShapeElement,
  StickerElement,
  TextElement,
} from '../types'
import { useImage } from '../hooks/useImage'
import { useEditor } from '../store/editorStore'
import { computeFilterConfig, computeFilterConfigFromStack } from '../lib/filters'
import { tracePhotoShape } from '../lib/shapes'

function toBlend(mode: string | undefined): any {
  if (!mode || mode === 'normal') return 'source-over'
  return mode as any
}

interface NodeProps<T extends CanvasElement> {
  el: T
  onSelect: (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (patch: Partial<CanvasElement>) => void
  onEditText?: (id: string) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
}

// Shared transform → store bridge. We keep scaleX/scaleY on the node (rather
// than baking size) so a single Transformer works uniformly for every type.
function commonHandlers(
  onChange: (patch: Partial<CanvasElement>) => void,
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void,
): {
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
} {
  return {
    onDragMove: (e) => {
      onDragMove?.(e)
    },
    onDragEnd: (e) => onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e) => {
      const node = e.target
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      })
    },
  }
}

function PhotoNode({ el, onSelect, onChange, onDragMove }: NodeProps<PhotoElement>) {
  const exporting = useEditor((s) => s.exporting)
  const displaySrc = exporting
    ? (el.originalSrc ?? el.previewSrc ?? el.src)
    : (el.previewSrc ?? el.src)
  const image = useImage(displaySrc)
  const ref = useRef<Konva.Image>(null)
  const shape = el.shape ?? 'rect'

  useEffect(() => {
    const node = ref.current
    if (!node || !image) return
    const cfg = el.filterStack
      ? computeFilterConfigFromStack(el.filterStack)
      : computeFilterConfig(el.filters)
    node.cache()
    node.filters(cfg.filters)
    node.brightness(cfg.brightness)
    node.contrast(cfg.contrast)
    node.hue(cfg.hue)
    node.saturation(cfg.saturation)
    node.luminance(cfg.luminance)
    node.blurRadius(cfg.blurRadius)
    node.getLayer()?.batchDraw()
  }, [image, el.filters, el.filterStack, el.crop, el.width, el.height])

  const v = el.filters.vignette

  return (
    <Group
      id={el.id}
      name="element"
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      opacity={el.opacity ?? 1}
      globalCompositeOperation={toBlend(el.blendMode)}
      draggable
      onClick={(e) => onSelect(e)}
      onTap={(e) => onSelect(e)}
      clipFunc={
        shape !== 'rect'
          ? (ctx) => tracePhotoShape(ctx, shape, el.width, el.height)
          : undefined
      }
      {...commonHandlers(onChange, onDragMove)}
    >
      <KonvaImage
        ref={ref}
        image={image}
        width={el.width}
        height={el.height}
        crop={el.crop}
      />
      {v > 0 && (
        <Rect
          width={el.width}
          height={el.height}
          listening={false}
          fillRadialGradientStartPoint={{ x: el.width / 2, y: el.height / 2 }}
          fillRadialGradientEndPoint={{ x: el.width / 2, y: el.height / 2 }}
          fillRadialGradientStartRadius={Math.min(el.width, el.height) * 0.3}
          fillRadialGradientEndRadius={Math.max(el.width, el.height) * 0.72}
          fillRadialGradientColorStops={[0, 'rgba(0,0,0,0)', 1, `rgba(0,0,0,${v})`]}
        />
      )}
    </Group>
  )
}

function TextNode({ el, onSelect, onChange, onEditText, onDragMove }: NodeProps<TextElement>) {
  const textRef = useRef<Konva.Text>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const curve = el.curve ?? 0

  useLayoutEffect(() => {
    const n = textRef.current
    if (n) setDims({ w: n.width(), h: n.height() })
  }, [
    el.text,
    el.fontSize,
    el.fontFamily,
    el.fontStyle,
    el.strokeWidth,
  ])

  const paint = {
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontStyle: el.fontStyle,
    fill: el.fill,
    stroke: el.strokeWidth ? el.stroke : undefined,
    strokeWidth: el.strokeWidth ?? 0,
    fillAfterStrokeEnabled: true,
    shadowColor: el.shadowBlur ? el.shadowColor : undefined,
    shadowBlur: el.shadowBlur ?? 0,
    shadowOpacity: el.shadowBlur ? 0.85 : 0,
    width: el.width,
    lineHeight: el.lineHeight ?? 1.2,
    align: el.align ?? 'left',
  }

  const chip = el.chip
  const bow = `M 0 0 Q ${dims.w / 2} ${-curve * 2} ${dims.w} 0`

  return (
    <Group
      id={el.id}
      name="element"
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      opacity={el.opacity ?? 1}
      globalCompositeOperation={toBlend(el.blendMode)}
      draggable
      onClick={(e) => onSelect(e)}
      onTap={(e) => onSelect(e)}
      onDblClick={() => onEditText?.(el.id)}
      onDblTap={() => onEditText?.(el.id)}
      {...commonHandlers(onChange, onDragMove)}
    >
      {chip && curve === 0 && dims.w > 0 && (
        <Rect
          x={-chip.padding}
          y={-chip.padding}
          width={dims.w + chip.padding * 2}
          height={dims.h + chip.padding * 2}
          fill={chip.color}
          cornerRadius={chip.radius}
          listening={false}
        />
      )}
      <KonvaText ref={textRef} text={el.text} visible={curve === 0} {...paint} />
      {curve > 0 && dims.w > 0 && (
        <TextPath text={el.text} data={bow} {...paint} />
      )}
    </Group>
  )
}

function DrawingNode({ el, onSelect, onChange, onDragMove }: NodeProps<DrawingElement>) {
  return (
    <Line
      id={el.id}
      name="element"
      points={el.points}
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      lineCap="round"
      lineJoin="round"
      tension={0.4}
      hitStrokeWidth={Math.max(el.strokeWidth, 20)}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      opacity={el.opacity ?? 1}
      globalCompositeOperation={toBlend(el.blendMode)}
      draggable
      onClick={(e) => onSelect(e)}
      onTap={(e) => onSelect(e)}
      {...commonHandlers(onChange, onDragMove)}
    />
  )
}

function StickerNode({ el, onSelect, onChange, onDragMove }: NodeProps<StickerElement>) {
  return (
    <KonvaText
      id={el.id}
      name="element"
      text={el.emoji}
      fontSize={el.fontSize}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      opacity={el.opacity ?? 1}
      globalCompositeOperation={toBlend(el.blendMode)}
      draggable
      onClick={(e) => onSelect(e)}
      onTap={(e) => onSelect(e)}
      {...commonHandlers(onChange, onDragMove)}
    />
  )
}

function ShapeNode({ el, onSelect, onChange, onDragMove }: NodeProps<ShapeElement>) {
  const common = {
    id: el.id,
    name: 'element',
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    scaleX: el.scaleX,
    scaleY: el.scaleY,
    opacity: el.opacity ?? 1,
    globalCompositeOperation: toBlend(el.blendMode),
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    ...commonHandlers(onChange, onDragMove),
  }

  const shapeProps = {
    fill: el.fill,
    stroke: el.strokeWidth ? el.stroke : undefined,
    strokeWidth: el.strokeWidth ?? 0,
    listening: true,
  }

  switch (el.shapeType) {
    case 'rect':
      return <Rect width={120} height={80} cornerRadius={8} {...common} {...shapeProps} />
    case 'circle':
      return <Rect width={100} height={100} cornerRadius={50} {...common} {...shapeProps} />
    case 'triangle':
      return (
        <RegularPolygon sides={3} radius={60} {...common} {...shapeProps} />
      )
    case 'star':
      return (
        <Star numPoints={5} innerRadius={25} outerRadius={55} {...common} {...shapeProps} />
      )
    case 'speech-bubble':
      return (
        <Path
          data={`M 0,40 Q 0,0 20,0 L 100,0 Q 120,0 120,20 L 120,60 Q 120,80 100,80 L 40,80 L 10,100 L 20,80 L 20,80 Q 0,80 0,60 Z`}
          {...common}
          {...shapeProps}
        />
      )
    case 'heart':
      return (
        <Path
          data={`M60,30 C60,10 40,0 30,10 C20,0 0,10 0,30 C0,50 30,70 30,70 C30,70 60,50 60,30 Z`}
          {...common}
          {...shapeProps}
        />
      )
    case 'arrow':
      return (
        <Arrow
          points={[0, 0, 120, 0]}
          pointerLength={el.arrowHead?.size ?? 12}
          pointerWidth={el.arrowHead?.size ?? 12}
          {...common}
          {...shapeProps}
        />
      )
    default:
      if (el.path) {
        return <Path data={el.path} {...common} {...shapeProps} />
      }
      return <Rect width={120} height={80} cornerRadius={8} {...common} {...shapeProps} />
  }
}

export function ElementNode({
  el,
  onSelect,
  onChange,
  onEditText,
  onDragMove,
}: {
  el: CanvasElement
  onSelect: (e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (patch: Partial<CanvasElement>) => void
  onEditText?: (id: string) => void
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void
}) {
  switch (el.type) {
    case 'photo':
      return <PhotoNode el={el} onSelect={onSelect} onChange={onChange} onDragMove={onDragMove} />
    case 'text':
      return (
        <TextNode
          el={el}
          onSelect={onSelect}
          onChange={onChange}
          onEditText={onEditText}
          onDragMove={onDragMove}
        />
      )
    case 'sticker':
      return <StickerNode el={el} onSelect={onSelect} onChange={onChange} onDragMove={onDragMove} />
    case 'drawing':
      return <DrawingNode el={el} onSelect={onSelect} onChange={onChange} onDragMove={onDragMove} />
    case 'shape':
      return <ShapeNode el={el} onSelect={onSelect} onChange={onChange} onDragMove={onDragMove} />
    default:
      return null
  }
}
