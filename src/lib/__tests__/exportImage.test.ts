import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadDataURL, shareDataURL, canShareImage } from '../exportImage'

describe('downloadDataURL', () => {
  let clickSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {})
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an anchor and triggers click with default filename', () => {
    const dataURL = 'data:image/png;base64,iVBORw0KGgo='
    downloadDataURL(dataURL, 'png')
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(removeSpy).toHaveBeenCalledOnce()
  })

  it('uses provided filename', () => {
    const dataURL = 'data:image/png;base64,iVBORw0KGgo='
    downloadDataURL(dataURL, 'png', 'my-collage.png')
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('uses correct extension for jpg', () => {
    const dataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    downloadDataURL(dataURL, 'jpg')
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('uses correct extension for webp', () => {
    const dataURL = 'data:image/webp;base64,UklGRiQ='
    downloadDataURL(dataURL, 'webp')
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})

describe('canShareImage', () => {
  it('returns false when navigator.share is missing', () => {
    vi.stubGlobal('navigator', { canShare: undefined, share: undefined })
    expect(canShareImage()).toBe(false)
    vi.unstubAllGlobals()
  })

  it('returns true when navigator.canShare and navigator.share exist', () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: async () => {},
    })
    expect(canShareImage()).toBe(true)
    vi.unstubAllGlobals()
  })
})

describe('shareDataURL', () => {
  it('returns false when sharing is unsupported', async () => {
    vi.stubGlobal('navigator', { canShare: undefined, share: undefined })
    const result = await shareDataURL('data:image/png;base64,abc', 'png')
    expect(result).toBe(false)
    vi.unstubAllGlobals()
  })

  it('returns false when canShare returns false for files', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => false,
      share: async () => {},
    })
    const result = await shareDataURL('data:image/png;base64,abc', 'png')
    expect(result).toBe(false)
    vi.unstubAllGlobals()
  })

  it('returns true on successful share', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: async () => {},
    })
    const result = await shareDataURL('data:image/png;base64,iVBORw0KGgo=', 'png')
    expect(result).toBe(true)
    vi.unstubAllGlobals()
  })

  it('returns false when share throws', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: async () => {
        throw new Error('cancelled')
      },
    })
    const result = await shareDataURL('data:image/png;base64,iVBORw0KGgo=', 'png')
    expect(result).toBe(false)
    vi.unstubAllGlobals()
  })
})
