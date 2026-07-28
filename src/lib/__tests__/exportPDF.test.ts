import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { exportPDF } from '../exportPDF'
import { bookSizeById, pageSizePt } from '../photoBook'

/**
 * These build a real PDF and read it back rather than mocking pdf-lib. The
 * thing that was wrong here was the *number* handed to `addPage`, and only an
 * assertion on the finished document catches that.
 */

/** A 1×1 PNG, scaled to a claimed size by the caller's expectations. */
const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** A 2×3 PNG — enough to tell portrait from landscape. */
const PNG_2x3 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAABS3WWCAAAAFUlEQVR42mNkYPjPgAyYGNAAdgEAG1oBGZMSyGUAAAAASUVORK5CYII='

const sizesOf = async (bytes: Uint8Array) => {
  const doc = await PDFDocument.load(bytes)
  return doc.getPages().map((p) => p.getSize())
}

describe('exportPDF page geometry', () => {
  it('sizes a page at 300 DPI, not at 72', async () => {
    // The regression: PDF units are points, so passing pixels to addPage
    // declared 1px = 1/72", turning a 2160px collage into a 30-inch sheet.
    const sizes = await sizesOf(await exportPDF([{ dataUrl: PNG_2x3 }]))
    expect(sizes).toHaveLength(1)
    // 2px at 300 DPI = 0.00667in = 0.48pt — emphatically not 2pt.
    expect(sizes[0].width).toBeCloseTo((2 / 300) * 72, 4)
    expect(sizes[0].height).toBeCloseTo((3 / 300) * 72, 4)
  })

  it('gives every page the requested physical size', async () => {
    const a4 = pageSizePt(bookSizeById('a4-portrait'))
    const sizes = await sizesOf(
      await exportPDF([{ dataUrl: PNG_2x3 }, { dataUrl: PNG_1x1 }], { page: a4 }),
    )
    expect(sizes).toHaveLength(2)
    for (const s of sizes) {
      // A4 is 210 × 297 mm = 595.28 × 841.89 pt.
      expect(s.width).toBeCloseTo(595.28, 1)
      expect(s.height).toBeCloseTo(841.89, 1)
    }
  })

  it('keeps every page the same size even when the boards differ', async () => {
    // Pages in a project need not share a board size — setBoardSize only
    // touches the page you are on — but a book has to be bindable.
    const square = pageSizePt(bookSizeById('square-21'))
    const sizes = await sizesOf(
      await exportPDF([{ dataUrl: PNG_2x3 }, { dataUrl: PNG_1x1 }], { page: square }),
    )
    expect(sizes[0]).toEqual(sizes[1])
  })

  it('embeds JPEG as well as PNG', async () => {
    // A 2×2 JPEG. Format is chosen from the data URL's mime type; getting it
    // wrong makes pdf-lib throw rather than silently degrade.
    const jpg =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAACAAIBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='
    const bytes = await exportPDF([{ dataUrl: jpg }])
    expect((await sizesOf(bytes)).length).toBe(1)
  })

  it('still accepts a bare title as the second argument', async () => {
    const doc = await PDFDocument.load(await exportPDF([{ dataUrl: PNG_1x1 }], 'My Book'))
    expect(doc.getTitle()).toBe('My Book')
  })
})

describe('exportPDF page numbers', () => {
  it('writes a number only on the pages that ask for one', async () => {
    const a4 = pageSizePt(bookSizeById('a4-portrait'))
    const withNumbers = await exportPDF(
      [
        { dataUrl: PNG_1x1, pageNumber: null },
        { dataUrl: PNG_1x1, pageNumber: 1 },
      ],
      { page: a4 },
    )
    const without = await exportPDF(
      [{ dataUrl: PNG_1x1 }, { dataUrl: PNG_1x1 }],
      { page: a4 },
    )
    // A numbered book carries an embedded font and the glyphs; an unnumbered
    // one has neither, so it is strictly smaller.
    expect(withNumbers.byteLength).toBeGreaterThan(without.byteLength)
  })
})
