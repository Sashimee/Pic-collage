import { useEffect, useRef } from 'react'
import { Image as KonvaImage, Text as KonvaText } from 'react-konva'
import type Konva from 'konva'
import type {
  CanvasElement,
  PhotoElement,
  StickerElement,
  TextElement,
} from '../types'
import { useImage } from '../hooks/useImage'
import { computeFilterConfig } from '../lib/filters'

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

  // (Re)build the Konva filter cache whenever the bitmap or filter values change.
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
    node.getLayer()?.batchDraw()
  }, [image, el.filters])

  return (
    <KonvaImage
      ref={ref}
      id={el.id}
      name="element"
      image={image}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
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
