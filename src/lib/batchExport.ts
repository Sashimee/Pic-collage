import JSZip from 'jszip'
import { exportImage } from './exportImage'
import type { CanvasElement } from '../types'

export async function batchExport(
  elements: CanvasElement[],
  board: { width: number; height: number; background: string },
  configs: { format: 'png' | 'jpg'; width: number; height: number }[],
): Promise<Blob> {
  const zip = new JSZip()
  const folder = zip.folder('exports')!
  for (const cfg of configs) {
    const dataUrl = await exportImage(elements, board, cfg.format, cfg.width, cfg.height)
    const base64 = dataUrl.split(',')[1]
    const ext = cfg.format === 'png' ? 'png' : 'jpg'
    folder.file(`export_${cfg.width}x${cfg.height}.${ext}`, base64, { base64: true })
  }
  return await zip.generateAsync({ type: 'blob' })
}
