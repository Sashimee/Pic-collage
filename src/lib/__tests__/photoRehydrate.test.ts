import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  stripPhotoUrls,
  rehydratePhotos,
  stripBackgroundUrl,
  rehydrateBackground,
  backgroundKey,
} from '../photoRehydrate'
import { putPhoto } from '../persistence'
import type { Background, CanvasElement, PhotoElement } from '../../types'

/*
 * Photo elements hold their pixels as blob: object URLs, which are handles into
 * the current document and die on reload. Saved projects and version snapshots
 * stored them verbatim, so reopening either after a restart showed a collage
 * with no photos. These cover the strip/rebuild pair that fixes it.
 */

const photo = (over: Partial<PhotoElement> = {}): PhotoElement => ({
  id: 'p1',
  type: 'photo',
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  width: 100,
  height: 100,
  src: 'blob:http://localhost/live-preview',
  previewSrc: 'blob:http://localhost/live-preview',
  originalSrc: 'blob:http://localhost/live-original',
  thumbSrc: 'blob:http://localhost/live-thumb',
  photoId: 'abc',
  filters: {} as PhotoElement['filters'],
  ...over,
})

const text = (): CanvasElement => ({
  id: 't1',
  type: 'text',
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  text: 'hello',
  fontFamily: 'sans-serif',
  fontSize: 40,
  fill: '#000',
  fontStyle: 'normal',
})

let urlCounter = 0

beforeEach(() => {
  urlCounter = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => `blob:http://localhost/rebuilt-${++urlCounter}`,
    revokeObjectURL: () => {},
  })
})

describe('stripPhotoUrls', () => {
  it('drops every transient URL but keeps the photoId', () => {
    const [el] = stripPhotoUrls([photo()]) as PhotoElement[]
    expect(el.src).toBe('')
    expect(el.previewSrc).toBeUndefined()
    expect(el.originalSrc).toBeUndefined()
    expect(el.thumbSrc).toBeUndefined()
    expect(el.photoId).toBe('abc')
  })

  it('leaves non-photo elements untouched', () => {
    const input = text()
    expect(stripPhotoUrls([input])[0]).toEqual(input)
  })

  it('serialises without any blob: URL surviving', () => {
    // The actual failure mode: a blob: URL reaching IndexedDB.
    const json = JSON.stringify(stripPhotoUrls([photo(), text()]))
    expect(json).not.toContain('blob:')
  })
})

describe('rehydratePhotos', () => {
  it('rebuilds live URLs from the stored blobs', async () => {
    await putPhoto('abc:orig', new Blob(['o'], { type: 'image/jpeg' }))
    await putPhoto('abc:prev', new Blob(['p'], { type: 'image/jpeg' }))
    await putPhoto('abc:thumb', new Blob(['t'], { type: 'image/jpeg' }))

    const stored = stripPhotoUrls([photo()])
    const [el] = (await rehydratePhotos(stored)) as PhotoElement[]

    expect(el.src).toMatch(/^blob:/)
    expect(el.previewSrc).toMatch(/^blob:/)
    expect(el.originalSrc).toMatch(/^blob:/)
    expect(el.thumbSrc).toMatch(/^blob:/)
    expect(el.photoId).toBe('abc')
  })

  it('survives a missing original — the preview is what the canvas draws', async () => {
    await putPhoto('only-prev:prev', new Blob(['p'], { type: 'image/jpeg' }))

    const stored = stripPhotoUrls([photo({ photoId: 'only-prev' })])
    const [el] = (await rehydratePhotos(stored)) as PhotoElement[]

    expect(el.src).toMatch(/^blob:/)
    expect(el.originalSrc).toBeUndefined()
  })

  it('drops a photo whose blobs are gone rather than leaving it broken', async () => {
    const stored = stripPhotoUrls([photo({ photoId: 'vanished' }), text()])
    const out = await rehydratePhotos(stored)

    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('text')
  })

  it('drops a photo with no photoId at all', async () => {
    const stored = stripPhotoUrls([photo({ photoId: undefined })])
    expect(await rehydratePhotos(stored)).toHaveLength(0)
  })

  it('leaves already-live elements alone instead of minting new URLs', async () => {
    // Same-session restores arrive with working URLs; re-minting would leak.
    const live = photo()
    const [el] = (await rehydratePhotos([live])) as PhotoElement[]
    expect(el.src).toBe(live.src)
    expect(urlCounter).toBe(0)
  })

  it('round-trips: strip then rehydrate gives a usable element again', async () => {
    await putPhoto('rt:prev', new Blob(['p'], { type: 'image/jpeg' }))
    const original = photo({ photoId: 'rt', x: 42, width: 300 })

    const [el] = (await rehydratePhotos(stripPhotoUrls([original]))) as PhotoElement[]

    expect(el.src).toMatch(/^blob:/)
    // Everything that isn't a transient URL comes back unchanged.
    expect(el.x).toBe(42)
    expect(el.width).toBe(300)
    expect(el.id).toBe(original.id)
  })
})

/*
 * The board background can be a photo too. It is not a CanvasElement, so
 * neither helper above ever touched it — its blob: URL was persisted verbatim
 * and dead on the next load, the very failure this module exists to prevent.
 */
const bg = (over: Partial<Background> = {}): Background => ({
  type: 'photo',
  color: '#ffffff',
  gradientFrom: '#6366f1',
  gradientTo: '#ec4899',
  gradientAngle: 0,
  patternId: 'dots',
  patternColor: '#000000',
  photoSrc: 'blob:http://localhost/live-bg',
  photoId: 'bg-1',
  ...over,
})

describe('stripBackgroundUrl', () => {
  it('drops the object URL and keeps the id', () => {
    const stored = stripBackgroundUrl(bg())
    expect(stored.photoSrc).toBeUndefined()
    expect(stored.photoId).toBe('bg-1')
  })

  it('leaves a background with no photo alone', () => {
    const solid = bg({ type: 'solid', photoSrc: undefined, photoId: undefined })
    expect(stripBackgroundUrl(solid)).toEqual(solid)
  })

  it('survives a JSON round trip with no blob: URL in it', () => {
    expect(JSON.stringify(stripBackgroundUrl(bg()))).not.toContain('blob:')
  })
})

describe('rehydrateBackground', () => {
  it('rebuilds the URL from the stored blob', async () => {
    await putPhoto(backgroundKey('bg-1'), new Blob(['x'], { type: 'image/jpeg' }))
    const out = await rehydrateBackground(stripBackgroundUrl(bg()))
    expect(out.photoSrc).toMatch(/^blob:/)
    expect(out.photoSrc).not.toBe('blob:http://localhost/live-bg')
  })

  it('falls back to the flat colour when the blob is gone', async () => {
    const out = await rehydrateBackground(stripBackgroundUrl(bg({ photoId: 'vanished' })))
    // A missing background must not leave a broken image behind.
    expect(out.photoSrc).toBeUndefined()
    expect(out.color).toBe('#ffffff')
  })

  it('leaves an already-live background alone', async () => {
    const live = bg()
    expect((await rehydrateBackground(live)).photoSrc).toBe('blob:http://localhost/live-bg')
  })

  it('ignores a background that is not a photo', async () => {
    const solid = bg({ type: 'gradient' })
    expect(await rehydrateBackground(solid)).toEqual(solid)
  })
})
