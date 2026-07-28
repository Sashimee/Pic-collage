// PDF export using pdf-lib (client-side, no server)
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { containRect } from './photoBook'

export interface PdfPageImage {
  dataUrl: string
  /** Printed on the page, in the bottom margin. Omit for none. */
  pageNumber?: number | null
}

export interface PdfOptions {
  title?: string
  /**
   * Physical sheet size in PDF points (1pt = 1/72"). Every page gets this size
   * and the image is fitted into it, centred. Omit to size each page from its
   * own bitmap.
   */
  page?: { widthPt: number; heightPt: number }
  /**
   * DPI to assume when sizing a page from its bitmap (only used without an
   * explicit `page`). 300 is print resolution; the old behaviour was 72, which
   * turned a 2160px bitmap into a 30-inch sheet.
   */
  dpi?: number
}

const base64ToBytes = (dataUrl: string): Uint8Array => {
  const bin = atob(dataUrl.split(',')[1] ?? '')
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/**
 * Assemble page bitmaps into a PDF at a real physical size.
 *
 * PDF units are points, so `addPage([w, h])` with pixel values silently
 * declares 1px = 1pt = 1/72 inch. That is how a 1080×1350 collage used to
 * become a 15 × 18.75 inch sheet: legal PDF, unusable print.
 */
export async function exportPDF(
  images: PdfPageImage[],
  options: PdfOptions | string = {},
): Promise<Uint8Array> {
  // `title` used to be the second positional argument; keep that call working.
  const opts: PdfOptions = typeof options === 'string' ? { title: options } : options
  const { title = 'Pic-Collage Export', dpi = 300 } = opts

  const pdfDoc = await PDFDocument.create()
  const needsFont = images.some((i) => i.pageNumber != null)
  const font = needsFont ? await pdfDoc.embedFont(StandardFonts.Helvetica) : null

  for (const img of images) {
    const bytes = base64ToBytes(img.dataUrl)
    const embedded = img.dataUrl.includes('image/png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes)

    // Take the pixel size from the bitmap itself rather than from the caller.
    // The old call site passed the *board* size next to a 2x bitmap, so the
    // two disagreed by exactly the pixel ratio and nothing said so.
    const pxW = embedded.width
    const pxH = embedded.height

    const pageW = opts.page ? opts.page.widthPt : (pxW / dpi) * 72
    const pageH = opts.page ? opts.page.heightPt : (pxH / dpi) * 72
    const page = pdfDoc.addPage([pageW, pageH])

    // Contain rather than fill: pages in a project need not share a board
    // size, and cropping to fit would cut content off a printed page.
    const rect = containRect(pxW, pxH, pageW, pageH)
    page.drawImage(embedded, rect)

    if (img.pageNumber != null && font) {
      const size = Math.max(7, pageH * 0.014)
      const label = String(img.pageNumber)
      const textWidth = font.widthOfTextAtSize(label, size)
      // Drawn in PDF space, never onto the collage bitmap — the montage stays
      // exactly as the user made it.
      page.drawText(label, {
        x: (pageW - textWidth) / 2,
        y: Math.max(6, pageH * 0.02),
        size,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })
    }
  }

  pdfDoc.setTitle(title)
  pdfDoc.setAuthor('Pic-Collage')
  pdfDoc.setCreationDate(new Date())

  return pdfDoc.save()
}

/** Download a PDF blob. */
export function downloadPDF(data: Uint8Array, filename: string = 'collage.pdf') {
  // Hand the bytes straight to Blob. This used to go through
  // `Array.from(data)` — a JS number array with one boxed entry per byte,
  // which is merely wasteful for one collage and ruinous for a photo book.
  const blob = new Blob([data as unknown as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking in the same tick can race the download in some browsers; the
  // image download path defers for the same reason.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
