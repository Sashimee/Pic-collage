import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Text as KonvaText,
  TextPath,
} from 'react-konva'
import type Konva from 'konva'
import type {
  CanvasElement,
  DrawingElement,
  PhotoElement,
  StickerElement,
  TextElement,
} from '../types'
import { useImage } from '../hooks/useImage'
import { computeFilterConfig } from '../lib/filters'
import { tracePhotoShape } from '../lib/shapes'

function toBlend(mode: string | undefined): any {
  if (!mode || mode === 'normal') return 'source-over'
  return mode as any
}

interface NodeProps<T extends CanvasElement> {
  el: T
  onSelect: () => void
  onChange: (patch: Partial<CanvasElement>) => void
  onEditText?: (id: string) => void
}

// Shared transform → store bridge. We keep scaleX/scaleY on the node (rather
// than baking size) so a single Transformer works uniformly for every type.
function commonHandlers(
  onChange: (patch: Partial<CanvasElement>) => void,
): {
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
} {
  return {
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

function PhotoNode({ el, onSelect, onChange }: NodeProps<PhotoElement>) {
  const image = useImage(el.src)
  const ref = useRef<Konva.Image>(null)
  const shape = el.shape ?? 'rect'

  // (Re)build the Konva filter cache whenever the bitmap, filter values, or
  // crop change. Blur/color filters live on the inner Image node.
  useEffect(() => {
    const node = ref.current
    if (!node || !image) return
    const cfg = computeFilterConfig(el.filters)
    node.cache()
    node.filters(cfg.filters)
    node.brightness(cfg.brightness)
    node.contrast(cfg.contrast)
    node.hue(cfg.hue)
    node.saturation(cfg.saturation)
    node.luminance(cfg.luminance)
    node.blurRadius(cfg.blurRadius)
    node.getLayer()?.batchDraw()
  }, [image, el.filters, el.crop, el.width, el.height])

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
      onClick={onSelect}
      onTap={onSelect}
      clipFunc={
        shape !== 'rect'
          ? (ctx) => tracePhotoShape(ctx, shape, el.width, el.height)
          : undefined
      }
      {...commonHandlers(onChange)}
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

function TextNode({ el, onSelect, onChange, onEditText }: NodeProps<TextElement>) {
  const textRef = useRef<Konva.Text>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const curve = el.curve ?? 0

  // Measure the rendered text so the chip background can size to it. The Text
  // node measures even while hidden (curved mode renders a TextPath instead).
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

  // Shared visual attrs for both the straight Text and the curved TextPath.
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
  }

  const chip = el.chip
  // Bow path for curved text: from (0,0) to (w,0), arching up by `curve`.
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
    onClick={onSelect}
    onTap={onSelect}
    onDblClick={() => onEditText?.(el.id)}
    onDblTap={() => onEditText?.(el.id)}
    {...commonHandlers(onChange)}
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

function DrawingNode({ el, onSelect, onChange }: NodeProps<DrawingElement>) {
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
      onClick={onSelect}
      onTap={onSelect}
      {...commonHandlers(onChange)}
    />
  )
}

function StickerNode({ el, onSelect, onChange }: NodeProps<StickerElement>) {
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
      onClick={onSelect}
      onTap={onSelect}
      {...commonHandlers(onChange)}
    />
  )
}

export function ElementNode({
  el,
  onSelect,
  onChange,
  onEditText,
}: {
  el: CanvasElement
  onSelect: () => void
  onChange: (patch: Partial<CanvasElement>) => void
  onEditText?: (id: string) => void
}) {
  switch (el.type) {
    case 'photo':
      return <PhotoNode el={el} onSelect={onSelect} onChange={onChange} />
    case 'text':
      return (
        <TextNode
          el={el}
          onSelect={onSelect}
          onChange={onChange}
          onEditText={onEditText}
        />
      )
    case 'sticker':
      return <StickerNode el={el} onSelect={onSelect} onChange={onChange} />
    case 'drawing':
      return <DrawingNode el={el} onSelect={onSelect} onChange={onChange} />
  }
}
