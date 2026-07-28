import { useCallback, useRef, useState } from 'react'

/**
 * Drag-to-reorder over a fixed-pitch list, on pointer events.
 *
 * Extracted from LayerPanel, which had the only working implementation: HTML5
 * `draggable` + dragstart/drop never fire from touch on iOS or Android, so on a
 * phone — the primary platform here — a grip handle looks draggable and does
 * nothing at all. Pointer events cover mouse, touch and pen through one path.
 *
 * The page strip needs the same gesture horizontally, so the mechanics live
 * here rather than being written a second time.
 */
/**
 * Which index the dragged item lands on, given the leading edge of where it has
 * been dragged to.
 *
 * This is deliberately the item's **final** index, which is the same number
 * `splice(from, 1)` + `splice(to, 0, item)` wants — dragging A one place right
 * in [A,B,C] gives 1, and that splice pair yields [B,A,C]. Reading it as an
 * insert-before slot instead is off by one in the rightward direction only,
 * which is the classic silent bug here, so it has a test.
 */
export function dropTarget(pos: number, itemSize: number, count: number): number {
  if (count <= 0 || itemSize <= 0) return 0
  return Math.max(0, Math.min(count - 1, Math.round(pos / itemSize)))
}

export interface PointerReorderOptions {
  axis: 'x' | 'y'
  /**
   * Pitch of one item along `axis`, in px, including any gap. Pass a function
   * to measure it from the DOM at drag time — a constant derived from padding
   * and borders goes quietly wrong the next time those classes change.
   */
  itemSize: number | (() => number)
  count: number
  /**
   * Called on drop with the item's start index and the index it should end up
   * at. `to` is the item's **final** position, which is also what
   * `splice(from, 1)` + `splice(to, 0, item)` expects — the two coincide, so
   * callers can pass it straight to an array move.
   */
  onDrop: (from: number, to: number) => void
  /** The scrolling container the items are laid out in. */
  scrollerRef: React.RefObject<HTMLElement | null>
  /**
   * Movement in px before this counts as a drag rather than a tap. Leave at 0
   * for a dedicated grip handle; set it when the whole item is draggable *and*
   * tappable, or every tap becomes a no-op reorder.
   */
  threshold?: number
}

export interface PointerReorder {
  /** Index currently being dragged, for dimming it. */
  dragIndex: number | null
  /** Index it would land on, for the drop indicator. */
  dropIndex: number | null
  /** Attach to the handle's `onPointerDown`. */
  start: (e: React.PointerEvent, index: number) => void
  /**
   * True from the moment a drag passes the threshold until the next
   * pointerdown. A click handler on a draggable item must check this, or
   * finishing a drag also selects.
   */
  moved: React.MutableRefObject<boolean>
}

export function usePointerReorder({
  axis,
  itemSize,
  count,
  onDrop,
  scrollerRef,
  threshold = 0,
}: PointerReorderOptions): PointerReorder {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const moved = useRef(false)

  const start = useCallback(
    (e: React.PointerEvent, index: number) => {
      const scroller = scrollerRef.current
      if (!scroller || index < 0 || index >= count) return
      const size = typeof itemSize === 'function' ? itemSize() : itemSize

      moved.current = false
      const horizontal = axis === 'x'
      // Only claim the gesture outright for a dedicated handle. With a
      // threshold the item is tappable too, and preventDefault here costs the
      // click that a tap depends on.
      if (threshold <= 0) {
        e.preventDefault()
        setDragIndex(index)
      }
      e.stopPropagation()

      const handle = e.currentTarget as HTMLElement
      // Capture keeps the move/up stream on this element even when the finger
      // leaves it. Safari throws if the pointer is already gone; the drag still
      // works without capture, so don't let it take the handler down.
      try {
        handle.setPointerCapture(e.pointerId)
      } catch {
        /* no capture — still usable */
      }

      const along = (ev: { clientX: number; clientY: number }) =>
        horizontal ? ev.clientX : ev.clientY

      // Re-read the container box on every move rather than capturing it once:
      // the rail can scroll under the finger mid-drag, and a stale rect makes
      // the drop index drift by however far it scrolled.
      const contentPos = (ev: { clientX: number; clientY: number }) => {
        const rect = scroller.getBoundingClientRect()
        return horizontal
          ? along(ev) - rect.left + scroller.scrollLeft
          : along(ev) - rect.top + scroller.scrollTop
      }

      // Distance from the pointer to the leading edge of the item it grabbed,
      // so the item doesn't jump to centre itself under the finger.
      const grabOffset = contentPos(e) - index * size
      const startedAt = along(e)

      let target = index
      let dragging = threshold <= 0

      const onMove = (ev: PointerEvent) => {
        if (!dragging) {
          if (Math.abs(along(ev) - startedAt) < threshold) return
          dragging = true
          moved.current = true
          setDragIndex(index)
        }
        target = dropTarget(contentPos(ev) - grabOffset, size, count)
        setDropIndex(target)
      }

      const onUp = () => {
        handle.releasePointerCapture?.(e.pointerId)
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onUp)
        handle.removeEventListener('pointercancel', onUp)
        if (dragging && target !== index) {
          moved.current = true
          onDrop(index, target)
        }
        setDragIndex(null)
        setDropIndex(null)
      }

      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onUp)
      handle.addEventListener('pointercancel', onUp)
    },
    [axis, count, itemSize, onDrop, scrollerRef, threshold],
  )

  return { dragIndex, dropIndex, start, moved }
}
