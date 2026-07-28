import { describe, it, expect } from 'vitest'
import {
  BOOK_PAGE_SIZES,
  bookSizeById,
  containRect,
  mmToPt,
  mmToPx,
  pageNumberFor,
  pageSizePt,
  pageSizePx,
  DEFAULT_BOOK_OPTIONS,
} from '../photoBook'

describe('physical units', () => {
  it('converts millimetres to PDF points', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 6) // one inch
    expect(mmToPt(210)).toBeCloseTo(595.28, 1) // A4 width
    expect(mmToPt(297)).toBeCloseTo(841.89, 1) // A4 height
  })

  it('converts millimetres to pixels at print resolution', () => {
    expect(mmToPx(25.4)).toBe(300)
    expect(mmToPx(210)).toBe(2480) // A4 at 300 DPI, the familiar figure
    expect(mmToPx(297)).toBe(3508)
  })

  it('gives A4 the right sheet and bitmap', () => {
    const a4 = bookSizeById('a4-portrait')
    expect(pageSizePt(a4).widthPt).toBeCloseTo(595.28, 1)
    expect(pageSizePx(a4)).toEqual({ width: 2480, height: 3508 })
  })

  it('falls back to the default for an unknown size id', () => {
    expect(bookSizeById('nope').id).toBe(BOOK_PAGE_SIZES[0].id)
  })
})

describe('containRect', () => {
  it('fits a portrait board onto a landscape sheet, centred, with margins', () => {
    const r = containRect(1000, 2000, 400, 400)
    expect(r.height).toBe(400)
    expect(r.width).toBe(200)
    expect(r.x).toBe(100) // centred horizontally
    expect(r.y).toBe(0)
  })

  it('fits a landscape board onto a portrait sheet', () => {
    const r = containRect(2000, 1000, 400, 400)
    expect(r.width).toBe(400)
    expect(r.height).toBe(200)
    expect(r.x).toBe(0)
    expect(r.y).toBe(100)
  })

  it('never crops — the fitted box always sits inside the sheet', () => {
    for (const [cw, ch] of [
      [1080, 1350],
      [3000, 500],
      [500, 3000],
      [800, 800],
    ]) {
      const r = containRect(cw, ch, 595, 842)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.width).toBeLessThanOrEqual(595 + 1e-9)
      expect(r.y + r.height).toBeLessThanOrEqual(842 + 1e-9)
    }
  })

  it('preserves the aspect ratio it was given', () => {
    const r = containRect(1080, 1350, 595, 842)
    expect(r.width / r.height).toBeCloseTo(1080 / 1350, 6)
  })

  it('fills the sheet rather than dividing by zero on an empty board', () => {
    expect(containRect(0, 0, 400, 500)).toEqual({ x: 0, y: 0, width: 400, height: 500 })
  })
})

describe('pageNumberFor', () => {
  it('leaves the cover unnumbered and starts at 1 on the next page', () => {
    const o = { ...DEFAULT_BOOK_OPTIONS, cover: true, pageNumbers: true }
    expect(pageNumberFor(0, o)).toBeNull()
    expect(pageNumberFor(1, o)).toBe(1)
    expect(pageNumberFor(2, o)).toBe(2)
  })

  it('numbers from the first page when there is no cover', () => {
    const o = { ...DEFAULT_BOOK_OPTIONS, cover: false, pageNumbers: true }
    expect(pageNumberFor(0, o)).toBe(1)
    expect(pageNumberFor(1, o)).toBe(2)
  })

  it('numbers nothing when numbering is off', () => {
    const o = { ...DEFAULT_BOOK_OPTIONS, pageNumbers: false }
    expect(pageNumberFor(0, o)).toBeNull()
    expect(pageNumberFor(5, o)).toBeNull()
  })
})
