import { useEffect, useRef } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { GridCell, GridLayout, PhotoElement } from '../types'
import { useImage } from '../hooks/useImage'
import { computeFilterConfig } from '../lib/filters'

interface Rect2 {
  x: number
  y: number
  w: number
  h: number
}

function cellRect(cell: GridCell, W: number, H: number, gap: number): Rect2 {
  return {
    x: cell.x * W + gap / 2,
    y: cell.y * H + gap / 2,
    w: cell.width * W - gap,
    h: cell.height * H - gap,
  }
}

// Place a photo inside a cell with object-fit: cover, then apply per-cell zoom
// (>= 1) and a normalised pan (each axis in [-1, 1], fraction of the overflow).
// Returns the image draw box plus the overflow available for panning.
function placePhoto(
  rect: Rect2,
  imgW: number,
  imgH: number,
  cellZoom = 1,
  cellPan: { x: number; y: number } = { x: 0, y: 0 },
) {
  const s = Math.max(rect.w / imgW, rect.h / imgH) * Math.max(1, cellZoom)
  const dw = imgW * s
  const dh = imgH * s
  const ox = dw - rect.w // horizontal overflow (>= 0)
  const oy = dh - rect.h
  const px = clamp(cellPan.x, -1, 1)
  const py = clamp(cellPan.y, -1, 1)
  const x = rect.x + (rect.w - dw) / 2 + (px * ox) / 2
  const y = rect.y + (rect.h - dh) / 2 + (py * oy) / 2
  return { x, y, dw, dh, ox, oy }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// Trace a rounded rectangle path for clipping / drawing.
function roundedRectPath(
  ctx: CanvasRenderingContext2D | Konva.Context,
  r: Rect2,
  radius: number,
) {
  const rad = Math.min(radius, r.w / 2, r.h / 2)
  ctx.beginPath()
  ctx.moveTo(r.x + rad, r.y)
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad)
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad)
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad)
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad)
  ctx.closePath()
}

function CellPhoto({
  el,
  rect,
  radius,
  selected,
  onSelect,
  onPan,
  onReset,
}: {
  el: PhotoElement
  rect: Rect2
  radius: number
  selected: boolean
  onSelect: () => void
  onPan: (pan: { x: number; y: number }) => void
  onReset: () => void
}) {
  const image = useImage(el.src)
  const ref = useRef<Konva.Image>(null)

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
  }, [image, el.filters])

  if (!image) return null

  // object-fit: cover + per-cell zoom/pan.
  const box = placePhoto(
    rect,
    image.naturalWidth,
    image.naturalHeight,
    el.cellZoom,
    el.cellPan,
  )
  const { x: imgX, y: imgY, dw, dh, ox, oy } = box
  const cx = rect.x + (rect.w - dw) / 2 // centred (pan 0) top-left
  const cy = rect.y + (rect.h - dh) / 2

  // Convert a dragged local top-left back to normalised pan, then persist.
  const commitPan = (node: Konva.Image) => {
    onPan({
      x: ox > 0 ? clamp((node.x() - cx) / (ox / 2), -1, 1) : 0,
      y: oy > 0 ? clamp((node.y() - cy) / (oy / 2), -1, 1) : 0,
    })
  }

  return (
    <Group
      clipFunc={
        radius > 0
          ? (ctx) => roundedRectPath(ctx, rect, radius)
          : undefined
      }
      clipX={radius > 0 ? undefined : rect.x}
      clipY={radius > 0 ? undefined : rect.y}
      clipWidth={radius > 0 ? undefined : rect.w}
      clipHeight={radius > 0 ? undefined : rect.h}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onReset}
      onDblTap={onReset}
    >
      <KonvaImage
        ref={ref}
        id={el.id}
        name="element"
        image={image}
        x={imgX}
        y={imgY}
        width={dw}
        height={dh}
        draggable={selected}
        // Clamp so the image always covers the cell. dragBoundFunc works in
        // absolute/stage coords, so map the local bounds through the parent
        // group's transform and back.
        dragBoundFunc={(pos) => {
          const node = ref.current
          const t = node?.getParent()?.getAbsoluteTransform().copy()
          if (!t) return pos
          const local = t.copy().invert().point(pos)
          const lx = clamp(local.x, cx - ox / 2, cx + ox / 2)
          const ly = clamp(local.y, cy - oy / 2, cy + oy / 2)
          return t.point({ x: lx, y: ly })
        }}
        onDragMove={(e) => commitPan(e.target as Konva.Image)}
        onDragEnd={(e) => commitPan(e.target as Konva.Image)}
      />
      {el.filters.vignette > 0 && (
        <Rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          listening={false}
          fillRadialGradientStartPoint={{ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }}
          fillRadialGradientEndPoint={{ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }}
          fillRadialGradientStartRadius={Math.min(rect.w, rect.h) * 0.3}
          fillRadialGradientEndRadius={Math.max(rect.w, rect.h) * 0.72}
          fillRadialGradientColorStops={[
            0,
            'rgba(0,0,0,0)',
            1,
            `rgba(0,0,0,${el.filters.vignette})`,
          ]}
        />
      )}
    </Group>
  )
}

export function GridView({
  layout,
  photos,
  width,
  height,
  gap,
  radius,
  selectedId,
  onSelect,
  onUpdate,
}: {
  layout: GridLayout
  photos: PhotoElement[]
  width: number
  height: number
  gap: number
  radius: number
  selectedId: string | null
  onSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<PhotoElement>) => void
}) {
  return (
    <>
      {layout.cells.map((cell, i) => {
        const rect = cellRect(cell, width, height, gap)
        const photo = photos[i]
        const isSelected = photo && photo.id === selectedId
        return (
          <Group key={i}>
            {photo ? (
              <CellPhoto
                el={photo}
                rect={rect}
                radius={radius}
                selected={!!isSelected}
                onSelect={() => onSelect(photo.id)}
                onPan={(pan) => onUpdate(photo.id, { cellPan: pan })}
                onReset={() =>
                  onUpdate(photo.id, { cellZoom: 1, cellPan: { x: 0, y: 0 } })
                }
              />
            ) : (
              <>
                <Rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  fill="#e5e7eb"
                  cornerRadius={Math.max(4, radius)}
                  dash={[12, 8]}
                  stroke="#9ca3af"
                  strokeWidth={2}
                />
                <Text
                  x={rect.x}
                  y={rect.y + rect.h / 2 - 24}
                  width={rect.w}
                  align="center"
                  text="＋"
                  fontSize={48}
                  fill="#9ca3af"
                  listening={false}
                />
              </>
            )}
            {isSelected && (
              <Rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                cornerRadius={radius}
                stroke="#6366f1"
                strokeWidth={6}
                listening={false}
              />
            )}
          </Group>
        )
      })}
    </>
  )
}
