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
  onSelect,
}: {
  el: PhotoElement
  rect: Rect2
  radius: number
  onSelect: () => void
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

  // object-fit: cover — scale so the photo fills the cell, then centre-crop.
  const s = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight)
  const dw = image.naturalWidth * s
  const dh = image.naturalHeight * s

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
    >
      <KonvaImage
        ref={ref}
        id={el.id}
        name="element"
        image={image}
        x={rect.x + (rect.w - dw) / 2}
        y={rect.y + (rect.h - dh) / 2}
        width={dw}
        height={dh}
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
}: {
  layout: GridLayout
  photos: PhotoElement[]
  width: number
  height: number
  gap: number
  radius: number
  selectedId: string | null
  onSelect: (id: string) => void
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
                onSelect={() => onSelect(photo.id)}
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
