import { useEffect } from 'react'

const CHECK_INTERVAL_MS = 45 * 60 * 1000

// Independent of the service worker: compares the build id baked into the
// currently-loaded index.html (see vite.config.ts's buildVersionPlugin)
// against dist/version.json fetched fresh from the network. Catches the
// cases the SW update path can miss — registration failed, the browser
// throttled the SW's own update checks, etc. — so a stale tab still notices
// a new deployment and reloads.
export function useVersionCheck() {
  useEffect(() => {
    const current = document
      .querySelector('meta[name="app-build"]')
      ?.getAttribute('content')
    if (!current) return

    const check = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json`, {
          cache: 'no-store',
        })
        const { build } = (await res.json()) as { build?: string }
        if (build && build !== current) {
          window.location.reload()
        }
      } catch {
        // Offline or request blocked — try again next tick.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }

    const id = setInterval(check, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
