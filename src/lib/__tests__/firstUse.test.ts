import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { claimFirstUse, hasSeen, markSeen, resetTips, seenTips } from '../firstUse'

/**
 * jsdom under Node 26 leaves the global `localStorage` unavailable, so these
 * install their own — and one test deliberately removes it again, because a
 * hint that cannot be remembered must still not throw.
 */
function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size
    },
    _data: data,
  }
}

let store: ReturnType<typeof fakeStorage>

beforeEach(() => {
  store = fakeStorage()
  vi.stubGlobal('localStorage', store)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('claimFirstUse', () => {
  it('is true once and false ever after', () => {
    expect(claimFirstUse('draw')).toBe(true)
    expect(claimFirstUse('draw')).toBe(false)
    expect(claimFirstUse('draw')).toBe(false)
  })

  it('claims as it answers, so a double-invoked effect shows one hint', () => {
    // React StrictMode runs effects twice in development. A check that only
    // wrote after the hint had been shown would answer true both times.
    const answers = [claimFirstUse('pinch'), claimFirstUse('pinch')]
    expect(answers).toEqual([true, false])
  })

  it('keeps hints independent', () => {
    expect(claimFirstUse('a')).toBe(true)
    expect(claimFirstUse('b')).toBe(true)
    expect(claimFirstUse('a')).toBe(false)
  })
})

describe('hasSeen / markSeen', () => {
  it('reports a hint only after it is marked', () => {
    expect(hasSeen('layers')).toBe(false)
    markSeen('layers')
    expect(hasSeen('layers')).toBe(true)
  })

  it('does not move the timestamp when marked twice', () => {
    markSeen('layers')
    const first = seenTips().layers
    markSeen('layers')
    expect(seenTips().layers).toBe(first)
  })
})

describe('migration from the old one-key-per-hint flags', () => {
  it('treats a previously dismissed onboarding as seen', () => {
    // Otherwise everyone who has already dismissed onboarding gets taught it
    // again on the first launch of the new build.
    store.setItem('pic-collage-onboarded-v2', '1')
    expect(hasSeen('welcome')).toBe(true)
    expect(claimFirstUse('welcome')).toBe(false)
  })

  it('carries the pinch hint over too', () => {
    store.setItem('piccollage-pinch-hint-shown', '1')
    expect(claimFirstUse('pinch')).toBe(false)
  })

  it('leaves hints alone that were never dismissed', () => {
    store.setItem('pic-collage-onboarded-v2', '1')
    expect(claimFirstUse('pinch')).toBe(true)
  })

  it('writes the migration through, so the old key is only read once', () => {
    store.setItem('pic-collage-onboarded-v2', '1')
    hasSeen('welcome')
    store.removeItem('pic-collage-onboarded-v2')
    expect(hasSeen('welcome')).toBe(true)
  })
})

describe('resetTips', () => {
  it('lets every tip play again, including the migrated ones', () => {
    store.setItem('pic-collage-onboarded-v2', '1')
    claimFirstUse('draw')
    resetTips()
    expect(claimFirstUse('draw')).toBe(true)
    expect(claimFirstUse('welcome')).toBe(true)
  })
})

describe('without storage', () => {
  it('answers rather than throwing when localStorage is missing', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', undefined)
    // Every hint is "new" and nothing persists — a repeated tip, not a crash.
    expect(() => claimFirstUse('draw')).not.toThrow()
    expect(claimFirstUse('draw')).toBe(true)
    expect(() => markSeen('draw')).not.toThrow()
    expect(() => resetTips()).not.toThrow()
    expect(hasSeen('draw')).toBe(false)
  })

  it('survives a storage that throws on write, as private mode does', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError')
      },
      removeItem: () => {},
    })
    expect(claimFirstUse('draw')).toBe(true)
  })

  it('ignores a corrupted record instead of breaking every hint', () => {
    store.setItem('pic-collage-tips-v1', 'not json')
    expect(claimFirstUse('draw')).toBe(true)
  })
})
