import { useEffect, useRef } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type { GridCell, GridLayout, PhotoElement } from '../types'
import { useImage } from '../hooks/useImage'
import { computeFilterConfig } from '../lib/filters'

const GAP = 12 // board-unit gutter between cells

interface Rect2 {
  x: number
  y: number
  w: number
  h: number
}

function cellRect(cell: GridCell, W: number, H: number): Rect2 {
  return {
    x: cell.x * W + GAP / 2,
    y: cell.y * H + GAP / 2,
    w: cell.width * W - GAP,
    h: cell.height * H - GAP,
  }
}

function CellPhoto({
  el,
  rect,
  onSelect,
}: {
  el: PhotoElement
  rect: Rect2
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
    node.getLayer()?.batchDraw()
  }, [image, el.filters])

  if (!image) return null

  // object-fit: cover — scale so the photo fills the cell, then centre-crop.
  const s = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight)
  const dw = image.naturalWidth * s
  const dh = image.naturalHeight * s

  return (
    <Group
      clipX={rect.x}
      clipY={rect.y}
      clipWidth={rect.w}
      clipHeight={rect.h}
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
    </Group>
  )
}

export function GridView({
  layout,
  photos,
  width,
  height,
  selectedId,
  onSelect,
}: {
  layout: GridLayout
  photos: PhotoElement[]
  width: number
  height: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <>
      {layout.cells.map((cell, i) => {
        const rect = cellRect(cell, width, height)
        const photo = photos[i]
        const isSelected = photo && photo.id === selectedId
        return (
          <Group key={i}>
            {photo ? (
              <CellPhoto el={photo} rect={rect} onSelect={() => onSelect(photo.id)} />
            ) : (
              <>
                <Rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  fill="#e5e7eb"
                  cornerRadius={4}
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
