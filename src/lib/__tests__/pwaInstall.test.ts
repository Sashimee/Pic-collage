import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

async function load() {
  vi.resetModules()
  return import('../pwaInstall')
}

function setUA(ua: string, maxTouchPoints = 0) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: maxTouchPoints,
    configurable: true,
  })
}

function setStandalone(on: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    value: (q: string) => ({
      matches: on && q.includes('standalone'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    configurable: true,
  })
}

const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36'
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const SAFARI_IPADOS =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const FIREFOX =
  'Mozilla/5.0 (Windows NT 10.0; rv:127.0) Gecko/20100101 Firefox/127.0'

/** Stand-in for the real BeforeInstallPromptEvent, which jsdom doesn't have. */
function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn().mockResolvedValue(undefined)
  const evt = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  })
  window.dispatchEvent(evt)
  return prompt
}

beforeEach(() => {
  setStandalone(false)
  setUA(CHROME_ANDROID)
})

afterEach(() => vi.restoreAllMocks())

describe('platform detection', () => {
  it('offers the manual Chromium route before any prompt event arrives', async () => {
    const { useInstall } = await load()
    expect(useInstall.getState().platform).toBe('android-manual')
    expect(useInstall.getState().canPrompt).toBe(false)
  })

  it('detects iPhone Safari', async () => {
    setUA(SAFARI_IPHONE)
    const { useInstall, isIOS } = await load()
    expect(isIOS()).toBe(true)
    expect(useInstall.getState().platform).toBe('ios')
  })

  it('detects iPadOS, which lies about being a Mac', async () => {
    setUA(SAFARI_IPADOS, 5)
    const { isIOS } = await load()
    expect(isIOS()).toBe(true)
  })

  it('does not mistake a real Mac for an iPad', async () => {
    setUA(SAFARI_IPADOS, 0)
    const { isIOS } = await load()
    expect(isIOS()).toBe(false)
  })

  it('reports Firefox as unsupported so no entry point is shown', async () => {
    setUA(FIREFOX)
    const { useInstall } = await load()
    expect(useInstall.getState().platform).toBe('unsupported')
  })

  it('knows when it is already running from the home screen', async () => {
    setStandalone(true)
    const { useInstall, isStandalone } = await load()
    expect(isStandalone()).toBe(true)
    expect(useInstall.getState().standalone).toBe(true)
  })
})

describe('beforeinstallprompt', () => {
  it('captures the event and enables a one-tap install', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    fireBeforeInstallPrompt()
    expect(useInstall.getState().canPrompt).toBe(true)
    expect(useInstall.getState().platform).toBe('prompt')
  })

  it('suppresses the browser mini-infobar so our own UI drives it', async () => {
    const { initPwaInstall } = await load()
    initPwaInstall()
    const evt = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    window.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
  })

  it('prompts and reports the outcome', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    const prompt = fireBeforeInstallPrompt('accepted')

    expect(await useInstall.getState().promptInstall()).toBe('accepted')
    expect(prompt).toHaveBeenCalled()
  })

  it('reports a dismissal without pretending it installed', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    fireBeforeInstallPrompt('dismissed')
    expect(await useInstall.getState().promptInstall()).toBe('dismissed')
  })

  it('the event is single-use — a second prompt is unavailable', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    fireBeforeInstallPrompt()
    await useInstall.getState().promptInstall()

    expect(useInstall.getState().canPrompt).toBe(false)
    expect(await useInstall.getState().promptInstall()).toBe('unavailable')
  })

  it('is unavailable when no event was ever captured', async () => {
    const { useInstall } = await load()
    expect(await useInstall.getState().promptInstall()).toBe('unavailable')
  })

  it('hides every entry point once the app reports itself installed', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    fireBeforeInstallPrompt()
    window.dispatchEvent(new Event('appinstalled'))

    expect(useInstall.getState().standalone).toBe(true)
    expect(useInstall.getState().canPrompt).toBe(false)
  })

  it('never throws when the browser rejects the prompt', async () => {
    const { useInstall, initPwaInstall } = await load()
    initPwaInstall()
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), {
        prompt: () => Promise.reject(new Error('nope')),
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      }),
    )
    await expect(useInstall.getState().promptInstall()).resolves.toBe('unavailable')
  })
})
