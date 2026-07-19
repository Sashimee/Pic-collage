/**
 * Batch export — render multiple collages off-screen and download them.
 * Uses a temporary Konva stage so it works without the live canvas.
 */
import Konva from 'konva'
import type { CanvasElement, Background } from '../types'
import { exportBoard } from './exportImage'
import { perfMark, perfMeasure } from './perf'

export interface BatchExportItem {
  elements: CanvasElement[]
  boardWidth: number
  boardHeight: number
  background: Background
  fileName: string
}

export interface BatchExportOptions {
  format?: import('./exportImage').ExportFormat
  quality?: number
  preset?: import('./exportImage').ExportPreset
}

export interface BatchExportResult {
  fileName: string
  ok: boolean
  error?: string
}

function createTempStage(width: number, height: number) {
  const stage = new Konva.Stage({
    container: document.createElement('div'),
    width,
    height,
  })
  stage.container().style.position = 'absolute'
  stage.container().style.left = '-9999px'
  stage.container().style.top = '-9999px'
  document.body.appendChild(stage.container())
  return stage
}

export async function batchExport(
  items: BatchExportItem[],
  options: BatchExportOptions = {},
): Promise<BatchExportResult[]> {
  perfMark('batch-export:start')
  const { format = 'png', quality = 0.92, preset = 'original' } = options
  const results = await Promise.all(
    items.map(async (item, i): Promise<BatchExportResult> => {
      perfMark(`batch-export:item-${i}`)
      const stage = createTempStage(item.boardWidth, item.boardHeight)
      const layer = new Konva.Layer()
      stage.add(layer)

      const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: item.boardWidth,
        height: item.boardHeight,
        fill: item.background.type === 'solid' ? item.background.color : '#ffffff',
      })
      layer.add(bg)

      for (const el of item.elements) {
        if (el.type === 'photo' && el.src) {
          const img = new Image()
          img.src = el.src
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
          layer.add(
            new Konva.Image({
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              image: img,
              rotation: el.rotation || 0,
              opacity: el.opacity ?? 1,
            }),
          )
        }
      }
      layer.draw()

      let result: BatchExportResult
      try {
        const dataUrl = exportBoard(
          layer,
          item.boardWidth,
          item.boardHeight,
          format,
          { quality, preset, pixelRatio: 2 },
        )
        const link = document.createElement('a')
        link.download = `${item.fileName}.${format === 'jpg' ? 'jpg' : format}`
        link.href = dataUrl
        link.click()
        result = { fileName: item.fileName, ok: true }
      } catch (err) {
        result = { fileName: item.fileName, ok: false, error: String(err) }
      }
      stage.destroy()
      perfMeasure(`batch-export:item-${i}`, `batch-export:item-${i}`)
      return result
    }),
  )
  perfMeasure('batch-export:total', 'batch-export:start')
  return results
}
