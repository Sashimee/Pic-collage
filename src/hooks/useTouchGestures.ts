import { useEffect, useRef } from 'react'

interface TouchGestureHandlers {
  onThreeFingerTap?: () => void
  onTwoFingerRotate?: (angleDelta: number) => void
  onEdgeSwipeLeft?: () => void
  onEdgeSwipeRight?: () => void
}

export function useTouchGestures(ref: React.RefObject<HTMLDivElement>, handlers: TouchGestureHandlers) {
  const touchPoints = useRef<Map<number, Touch>>(new Map())
  const lastAngle = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        touchPoints.current.set(t.identifier, t)
      }

      // Three finger tap = undo
      if (e.touches.length === 3) {
        e.preventDefault()
        handlers.onThreeFingerTap?.()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && handlers.onTwoFingerRotate) {
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
        if (lastAngle.current !== 0) {
          const delta = angle - lastAngle.current
          handlers.onTwoFingerRotate(delta)
        }
        lastAngle.current = angle
      }

      // Edge swipe detection
      if (e.touches.length === 1) {
        const t = e.touches[0]
        if (t.clientX < 20) handlers.onEdgeSwipeLeft?.()
        if (t.clientX > window.innerWidth - 20) handlers.onEdgeSwipeRight?.()
      }
    }

    const onTouchEnd = () => {
      if (touchPoints.current.size === 0) {
        lastAngle.current = 0
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref, handlers])
}
