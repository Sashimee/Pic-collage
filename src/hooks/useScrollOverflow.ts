import { useState, useEffect, useRef, type RefObject } from 'react'

export function useScrollOverflow<T extends HTMLElement>(): [
  RefObject<T | null>,
  boolean,
  boolean,
] {
  const ref = useRef<T | null>(null)
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      const isHorizontal = el.scrollWidth > el.clientWidth
      const isVertical = el.scrollHeight > el.clientHeight
      if (isHorizontal) {
        setCanScrollStart(el.scrollLeft > 1)
        setCanScrollEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
      } else if (isVertical) {
        setCanScrollStart(el.scrollTop > 1)
        setCanScrollEnd(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
      } else {
        setCanScrollStart(false)
        setCanScrollEnd(false)
      }
    }

    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    const obs = new ResizeObserver(check)
    obs.observe(el)

    return () => {
      el.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      obs.disconnect()
    }
  }, [])

  return [ref, canScrollStart, canScrollEnd]
}