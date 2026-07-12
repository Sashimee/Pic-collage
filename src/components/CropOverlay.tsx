import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEditor } from '../store/editorStore'
import { useImage } from '../hooks/useImage'
import { useT } from '../i18n/useLang'
import type { PhotoElement } from '../types'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

// A self-contained crop modal: its own Konva stage shows the selected photo at
// a fitted size with a draggable/resizable crop window. Applying writes the crop
// rectangle (in source pixels) back to the element and matches its board aspect.
export function CropOverlay() {
  const croppingId = useEditor((s) => s.croppingId)
  const el = useEditor((s) =>
    s.elements.find((e) => e.id === s.croppingId && e.type === 'photo'),
  ) as PhotoElement | undefined

  if (!croppingId || !el) return null
  return <CropModal el={el} />
}

function CropModal({ el }: { el: PhotoElement }) {
  const t = useT()
  const image = useImage(el.src)
  const setCropping = useEditor((s) => s.setCropping)
  const updateElement = useEditor((s) => s.updateElement)
  const rectRef = useRef<Konva.Rect>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Fit the natural image into the available modal area.
  const fit = useMemo(() => {
    if (!image) return { w: 0, h: 0, scale: 1 }
    const maxW = Math.min(window.innerWidth * 0.9, 820)
    const maxH = window.innerHeight * 0.6
    const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight)
    return { w: image.naturalWidth * scale, h: image.naturalHeight * scale, scale }
  }, [image])

  // Initial crop box (display coords) from an existing crop, else the whole image.
  const [box, setBox] = useState<Box | null>(null)
  useEffect(() => {
    if (!image || !fit.w) return
    if (el.crop) {
      setBox({
        x: el.crop.x * fit.scale,
        y: el.crop.y * fit.scale,
        width: el.crop.width * fit.scale,
        height: el.crop.height * fit.scale,
      })
    } else {
      setBox({ x: 0, y: 0, width: fit.w, height: fit.h })
    }
  }, [image, fit.w, fit.h, fit.scale, el.crop])

  // Attach the transformer to the crop rect once both exist.
  useEffect(() => {
    const tr = trRef.current
    const rect = rectRef.current
    if (tr && rect) {
      tr.nodes([rect])
      tr.getLayer()?.batchDraw()
    }
  }, [box])

  const clamp = (b: Box): Box => {
    const width = Math.min(b.width, fit.w)
    const height = Math.min(b.height, fit.h)
    return {
      width,
      height,
      x: Math.max(0, Math.min(b.x, fit.w - width)),
      y: Math.max(0, Math.min(b.y, fit.h - height)),
    }
  }

  const apply = () => {
    if (!box) return
    const inv = 1 / fit.scale
    const crop = {
      x: box.x * inv,
      y: box.y * inv,
      width: box.width * inv,
      height: box.height * inv,
    }
    // Keep the on-board width; match the element height to the crop's aspect.
    const height = el.width * (crop.height / crop.width)
    updateElement(el.id, { crop, height })
    setCropping(null)
  }

  const reset = () => setBox({ x: 0, y: 0, width: fit.w, height: fit.h })

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-4">
      <h2 className="text-sm font-semibold text-white">{t('crop.title')}</h2>
      {image && box && (
        <Stage width={fit.w} height={fit.h} className="rounded-lg shadow-2xl">
          <Layer>
            <KonvaImage image={image} width={fit.w} height={fit.h} opacity={0.45} />
            <KonvaImage
              image={image}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              crop={{
                x: box.x / fit.scale,
                y: box.y / fit.scale,
                width: box.width / fit.scale,
                height: box.height / fit.scale,
              }}
              listening={false}
            />
            <Rect
              ref={rectRef}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              stroke="#6366f1"
              strokeWidth={2}
              draggable
              onDragEnd={(e) =>
                setBox((b) =>
                  b ? clamp({ ...b, x: e.target.x(), y: e.target.y() }) : b,
                )
              }
              onTransformEnd={() => {
                const node = rectRef.current
                if (!node) return
                const next = clamp({
                  x: node.x(),
                  y: node.y(),
                  width: node.width() * node.scaleX(),
                  height: node.height() * node.scaleY(),
                })
                node.scaleX(1)
                node.scaleY(1)
                setBox(next)
              }}
            />
            <Transformer
              ref={trRef}
              rotateEnabled={false}
              keepRatio={false}
              anchorSize={14}
              borderStroke="#6366f1"
              anchorStroke="#6366f1"
              boundBoxFunc={(oldB, newB) =>
                newB.width < 24 || newB.height < 24 ? oldB : newB
              }
            />
          </Layer>
        </Stage>
      )}
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="min-h-[44px] rounded-lg bg-slate-700 px-4 text-sm text-slate-100 transition hover:bg-slate-600 active:scale-95"
        >
          {t('crop.reset')}
        </button>
        <button
          onClick={() => setCropping(null)}
          className="min-h-[44px] rounded-lg bg-slate-700 px-4 text-sm text-slate-100 transition hover:bg-slate-600 active:scale-95"
        >
          {t('crop.cancel')}
        </button>
        <button
          onClick={apply}
          className="min-h-[44px] rounded-lg bg-indigo-500 px-5 text-sm font-semibold text-white transition hover:bg-indigo-400 active:scale-95"
        >
          {t('crop.apply')}
        </button>
      </div>
    </div>
  )
}
