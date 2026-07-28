import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '../i18n/useLang'

// Re-check for a new deployment even if the tab is left open for hours —
// the browser only re-fetches sw.js on navigation/focus otherwise.
const UPDATE_CHECK_INTERVAL_MS = 45 * 60 * 1000

// Service-worker lifecycle UI. On a new deployment we auto-update: the SW
// (registerType 'autoUpdate', see vite.config.ts) activates itself and takes
// control of the open tab, then we reload — the in-progress collage survives
// because it's autosaved to IndexedDB and restored on load (see App.tsx). We
// only show a brief "updating" toast; no manual reload button.
export function UpdateBanner() {
  const t = useT()
  const [updating, setUpdating] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
    onNeedReload() {
      setUpdating(true)
      // Give the toast a frame to paint, then reload. The extra timeout is a
      // fallback in case the first reload gets swallowed (e.g. a stray
      // beforeunload handler) — reloading twice is harmless.
      setTimeout(() => window.location.reload(), 150)
      setTimeout(() => window.location.reload(), 4000)
    },
    onOfflineReady() {
      setOfflineReady(true)
      setTimeout(() => setOfflineReady(false), 3000)
    },
  })

  if (updating) {
    return (
      <div className="bg-grad-accent flex items-center gap-2 px-4 py-2 text-sm text-white">
        <span>{t('update.updating')}</span>
      </div>
    )
  }

  if (offlineReady) {
    // emerald-700, not -600: white on -600 is only 3.65:1, under the 4.5:1 AA
    // minimum for this 14px text. -700 gives 5.48:1.
    return (
      <div className="flex items-center gap-2 bg-emerald-700 px-4 py-2 text-sm text-white">
        <span>{t('update.offline')}</span>
      </div>
    )
  }

  return null
}
