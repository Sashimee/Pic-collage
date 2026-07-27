import { create } from 'zustand'

/**
 * "Add to home screen" support.
 *
 * Browsers differ enough that this cannot be one button:
 * - Chrome/Edge (Android + desktop) fire `beforeinstallprompt`, which we hold
 *   on to so our own button can trigger the real install dialog.
 * - iOS Safari implements none of that. Share → Add to Home Screen is the only
 *   route, so all we can do is explain it.
 * - Firefox has no install path at all, so the entry point hides itself rather
 *   than showing instructions that lead nowhere.
 */

export type InstallPlatform =
  /** A deferred prompt is (or will be) available — one tap installs. */
  | 'prompt'
  /** iOS Safari: manual Share → Add to Home Screen. */
  | 'ios'
  /** A Chromium-family browser that hasn't fired the event: show the ⋮ route. */
  | 'android-manual'
  /** No install path worth offering. */
  | 'unsupported'

/** The event isn't in lib.dom yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)

export function isIOS(): boolean {
  const s = ua()
  if (/iphone|ipad|ipod/i.test(s)) return true
  // iPadOS 13+ reports a desktop Mac UA; touch points give it away.
  return /macintosh/i.test(s) && (navigator.maxTouchPoints ?? 0) > 1
}

/** True once the app is running from the home screen rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // Safari's non-standard flag, still the only signal on iOS.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function detectPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'unsupported'
  if (deferred) return 'prompt'
  if (isIOS()) return 'ios'
  const s = ua()
  // Firefox and Safari-on-macOS have no install flow worth pointing at.
  if (/firefox|fxios/i.test(s)) return 'unsupported'
  if (/chrome|chromium|crios|edg|samsungbrowser|opr/i.test(s)) return 'android-manual'
  return 'unsupported'
}

interface InstallState {
  /** A real one-tap install is available right now. */
  canPrompt: boolean
  /** Already installed — every entry point should disappear. */
  standalone: boolean
  platform: InstallPlatform
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  /** Test seam. */
  refresh: () => void
}

export const useInstall = create<InstallState>((set) => ({
  canPrompt: false,
  standalone: isStandalone(),
  platform: detectPlatform(),

  promptInstall: async () => {
    const evt = deferred
    if (!evt) return 'unavailable'
    try {
      await evt.prompt()
      const { outcome } = await evt.userChoice
      // The event is single-use, whatever the answer.
      deferred = null
      set({ canPrompt: false, platform: detectPlatform() })
      return outcome
    } catch {
      deferred = null
      set({ canPrompt: false, platform: detectPlatform() })
      return 'unavailable'
    }
  },

  refresh: () => set({ standalone: isStandalone(), platform: detectPlatform() }),
}))

/**
 * Must run at module import, not from a React effect: `beforeinstallprompt`
 * routinely fires before React mounts, and a listener added afterwards misses
 * it for the whole page lifetime.
 */
export function initPwaInstall(): void {
  if (typeof window === 'undefined') return
  try {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault() // stop Chrome's own mini-infobar; we drive this
      deferred = e as BeforeInstallPromptEvent
      useInstall.setState({ canPrompt: true, platform: 'prompt' })
    })

    window.addEventListener('appinstalled', () => {
      deferred = null
      useInstall.setState({ canPrompt: false, standalone: true })
    })

    // Catches the case where the user launches from the home screen later in
    // the same session (and keeps the UI honest if they uninstall).
    window
      .matchMedia?.('(display-mode: standalone)')
      .addEventListener?.('change', () => useInstall.getState().refresh())
  } catch {
    /* never let this break the app */
  }
}
