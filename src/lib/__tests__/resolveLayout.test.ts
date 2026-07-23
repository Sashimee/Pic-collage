import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveLayoutById, GRID_LAYOUTS } from '../grids'
import { saveCustomLayout } from '../customLayoutStorage'
import { computeCellsFromLines } from '../customLayout'

// Node 26 + jsdom leaves the global `localStorage` unavailable, so provide a
// minimal in-memory stand-in for the custom-layout storage under test.
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('resolveLayoutById', () => {
  it('resolves a built-in preset layout', () => {
    const preset = GRID_LAYOUTS[0]
    expect(resolveLayoutById(preset.id)?.id).toBe(preset.id)
  })

  it('resolves a persisted custom layout drawn from dividers', () => {
    // one vertical + one horizontal divider → a 2x2 grid (4 cells)
    const cells = computeCellsFromLines([
      { id: 'v', type: 'vertical', position: 0.5 },
      { id: 'h', type: 'horizontal', position: 0.5 },
    ])
    expect(cells.length).toBe(4)
    saveCustomLayout({ id: 'custom-1', name: 'Mine', createdAt: 1, cells, lines: [] })

    const layout = resolveLayoutById('custom-1')
    expect(layout).toBeTruthy()
    expect(layout!.isCustom).toBe(true)
    expect(layout!.count).toBe(4)
    expect(layout!.cells).toHaveLength(4)
  })

  it('returns undefined for an unknown id', () => {
    expect(resolveLayoutById('nope')).toBeUndefined()
  })
})
