import { useEffect, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export function useFullScreen() {
  const [isFullScreen, setIsFullScreen] = useState(false)

  const getFullScreenElement = (): Element | null => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any
    return (
      d.fullscreenElement ??
      d.webkitFullscreenElement ??
      d.mozFullScreenElement ??
      d.msFullscreenElement ??
      null
    )
  }

  useEffect(() => {
    const handler = () => setIsFullScreen(!!getFullScreenElement())
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const toggle = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any
    const de = document.documentElement as any
    if (!getFullScreenElement()) {
      const req =
        de.requestFullscreen ??
        de.webkitRequestFullscreen ??
        de.mozRequestFullScreen ??
        de.msRequestFullscreen
      if (req) req.call(de).catch(() => {})
    } else {
      const exit =
        d.exitFullscreen ??
        d.webkitExitFullscreen ??
        d.mozCancelFullScreen ??
        d.msExitFullscreen
      if (exit) exit.call(d).catch(() => {})
    }
  }

  return { isFullScreen, toggle }
}

export function FullScreenButton() {
  const { isFullScreen, toggle } = useFullScreen()

  return (
    <button
      onClick={toggle}
      className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3"
      aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
    >
      {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  )
}
