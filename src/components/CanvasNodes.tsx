import { useEffect, useRef } from 'react'
import { Group, Image as KonvaImage, Rect, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import type {
  CanvasElement,
  PhotoElement,
  StickerElement,
  TextElement,
} from '../types'
import { useImage } from '../hooks/useImage'
import { computeFilterConfig } from '../lib/filters'
import { tracePhotoShape } from '../lib/shapes'

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
  return (
    <KonvaText
      id={el.id}
      name="element"
      text={el.text}
      fontFamily={el.fontFamily}
      fontSize={el.fontSize}
      fontStyle={el.fontStyle}
      fill={el.fill}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={() => onEditText?.(el.id)}
      onDblTap={() => onEditText?.(el.id)}
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
  }
}
