import { useEffect, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export function useFullScreen() {
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullScreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { })
    } else {
      document.exitFullscreen().catch(() => { })
    }
  }

  return { isFullScreen, toggle }
}

export function FullScreenButton() {
  const { isFullScreen, toggle } = useFullScreen()

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3"
      aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
    >
      {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  )
}
