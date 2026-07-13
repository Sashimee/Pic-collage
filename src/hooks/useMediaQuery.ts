import { useSyncExternalStore } from 'react'

// SSR-safe media-query hook built on useSyncExternalStore (no effect flash).
export function useMediaQuery(query: string): boolean {
  const subscribe = (cb: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }
  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// Desktop = Tailwind `lg` breakpoint and up. Below that we use the mobile
// bottom-sheet shell; at/above it, the docked tool rail + side panel.
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
