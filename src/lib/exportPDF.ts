// PDF export using pdf-lib (client-side, no server)
import { PDFDocument } from 'pdf-lib'

export async function exportPDF(
  images: { dataUrl: string; width: number; height: number }[],
  title: string = 'Pic-Collage Export',
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (const img of images) {
    // Convert data URL to bytes
    const base64 = img.dataUrl.split(',')[1]
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

    // Determine image format
    let embeddedImage
    if (img.dataUrl.includes('image/png')) {
      embeddedImage = await pdfDoc.embedPng(bytes)
    } else {
      embeddedImage = await pdfDoc.embedJpg(bytes)
    }

    // Page size matches image at 72 DPI
    const page = pdfDoc.addPage([img.width, img.height])
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    })
  }

  // Add metadata
  pdfDoc.setTitle(title)
  pdfDoc.setAuthor('Pic-Collage')
  pdfDoc.setCreationDate(new Date())

  return pdfDoc.save()
}

/** Download a PDF blob. */
export function downloadPDF(data: Uint8Array, filename: string = 'collage.pdf') {
  const array = Array.from(data)
  const blob = new Blob([new Uint8Array(array)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
