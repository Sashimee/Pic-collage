import { describe, it, expect } from 'vitest'
import {
  PROJECT_SCHEMA,
  activeDocument,
  singlePage,
  toProjectDocument,
  withActivePage,
} from '../projectSchema'
import type { LoadedDocument } from '../../store/editorStore'

/*
 * Every project already on a user's device is in the pre-page shape, so the
 * migration is the one piece of this feature that can destroy work rather than
 * merely annoy someone. These lean on the awkward inputs, not the happy path.
 */

const doc = (over: Partial<LoadedDocument> = {}): LoadedDocument =>
  ({
    boardWidth: 1080,
    boardHeight: 1350,
    background: { type: 'solid', color: '#fff' },
    mode: 'free',
    gridId: null,
    gridGap: 8,
    gridRadius: 0,
    frame: { width: 0, color: '#fff' },
    elements: [],
    ...over,
  }) as unknown as LoadedDocument

describe('toProjectDocument', () => {
  it('wraps a legacy single document as page one', () => {
    const legacy = doc({ boardWidth: 800 })
    const out = toProjectDocument(legacy)!

    expect(out.schema).toBe(PROJECT_SCHEMA)
    expect(out.pages).toHaveLength(1)
    expect(out.pages[0].boardWidth).toBe(800)
    expect(out.activePage).toBe(0)
  })

  it('passes a already-migrated project through', () => {
    const out = toProjectDocument({
      schema: PROJECT_SCHEMA,
      pages: [doc(), doc()],
      activePage: 1,
    })!
    expect(out.pages).toHaveLength(2)
    expect(out.activePage).toBe(1)
  })

  it('clamps a cursor that points past the end', () => {
    const out = toProjectDocument({ schema: 2, pages: [doc()], activePage: 7 })!
    expect(out.activePage).toBe(0)
  })

  it('clamps a negative or fractional cursor', () => {
    expect(toProjectDocument({ pages: [doc(), doc()], activePage: -3 })!.activePage).toBe(0)
    expect(toProjectDocument({ pages: [doc(), doc()], activePage: 1.7 })!.activePage).toBe(1)
  })

  it('defaults a missing cursor to the first page', () => {
    expect(toProjectDocument({ pages: [doc(), doc()] })!.activePage).toBe(0)
  })

  it('drops entries that are not documents rather than crashing later', () => {
    const out = toProjectDocument({ pages: [doc(), null, 'nope', { junk: 1 }] })!
    expect(out.pages).toHaveLength(1)
  })

  it('returns null for input with nothing usable', () => {
    for (const bad of [null, undefined, 0, '', 'string', [], { pages: [] }, { foo: 'bar' }]) {
      expect(toProjectDocument(bad)).toBeNull()
    }
  })

  it('rejects a document missing the fields a page cannot do without', () => {
    expect(toProjectDocument({ boardWidth: 100, boardHeight: 100 })).toBeNull() // no elements
    expect(toProjectDocument({ boardWidth: 100, elements: [] })).toBeNull() // no height
  })

  it('is idempotent — migrating twice changes nothing', () => {
    const once = toProjectDocument(doc())!
    expect(toProjectDocument(once)).toEqual(once)
  })
})

describe('page helpers', () => {
  it('activeDocument returns the page the cursor points at', () => {
    const p = toProjectDocument({ pages: [doc({ boardWidth: 1 }), doc({ boardWidth: 2 })], activePage: 1 })!
    expect(activeDocument(p).boardWidth).toBe(2)
  })

  it('withActivePage replaces only that page', () => {
    const p = toProjectDocument({ pages: [doc({ boardWidth: 1 }), doc({ boardWidth: 2 })], activePage: 1 })!
    const next = withActivePage(p, doc({ boardWidth: 99 }))

    expect(next.pages[0].boardWidth).toBe(1) // untouched
    expect(next.pages[1].boardWidth).toBe(99)
    expect(next.activePage).toBe(1)
    expect(p.pages[1].boardWidth).toBe(2) // original not mutated
  })

  it('singlePage round-trips through toProjectDocument', () => {
    const p = singlePage(doc({ boardWidth: 640 }))
    expect(toProjectDocument(p)).toEqual(p)
  })
})
