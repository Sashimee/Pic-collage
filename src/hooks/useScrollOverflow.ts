import { useCallback, useEffect, useRef, useState } from 'react'

// Tracks scroll position of a ref'd element so callers can show/hide
// overflow affordances (fade edges, arrow buttons) only when needed.
export function useScrollOverflow<T extends HTMLElement>(
  axis: 'x' | 'y',
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null)
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (axis === 'y') {
      setCanScrollStart(el.scrollTop > 4)
      setCanScrollEnd(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    } else {
      setCanScrollStart(el.scrollLeft > 4)
      setCanScrollEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
  }, [axis])

  useEffect(() => {
    const el = ref.current
    update()
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    // Observe the content too: a scroller pinned at max-height never changes
    // size itself when its children grow, so observing only `el` would miss it.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, ...deps])

  return { ref, canScrollStart, canScrollEnd, update }
}
