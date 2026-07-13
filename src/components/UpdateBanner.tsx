import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '../i18n/useLang'

// Service-worker lifecycle UI. On a new deployment we auto-update: activate the
// waiting worker and reload the page — the in-progress collage survives because
// it's autosaved to IndexedDB and restored on load (see App.tsx). We only show
// a brief "updating" toast; no manual reload button.
export function UpdateBanner() {
  const t = useT()
  const [updating, setUpdating] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setUpdating(true)
      // true = skipWaiting + reload once the new worker takes control.
      void updateServiceWorker(true)
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
    return (
      <div className="flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm text-white">
        <span>{t('update.offline')}</span>
      </div>
    )
  }

  return null
}
