import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdateBanner() {
  const [needsReload, setNeedsReload] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useRegisterSW({
    onOfflineReady() {
      setOfflineReady(true)
      setTimeout(() => setOfflineReady(false), 3000)
    },
  })

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = () => setNeedsReload(true)
    navigator.serviceWorker.addEventListener('controllerchange', handler)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handler)
  }, [])

  if (needsReload) {
    return (
      <div className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-sm text-accent-fg">
        <span>🔄 App updated — reload for the latest version.</span>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
        >
          Reload
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm text-white">
        <span>✓ App ready for offline use.</span>
      </div>
    )
  }

  return null
}
