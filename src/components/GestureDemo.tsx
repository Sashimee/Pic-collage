import { m, useReducedMotion } from './motion'

/**
 * Small animated diagrams of the gestures that nothing on screen can hint at.
 *
 * Inline SVG for the reasons already written down in InstallSheet: sharp at any
 * size, follows the theme, no network, and the labels stay translatable because
 * they live outside the drawing. Same conventions as the glyphs there — a
 * 24-unit box, `currentColor`, round caps — with the one addition that these
 * move.
 *
 * Under `prefers-reduced-motion` each demo renders its **final frame** rather
 * than looping. A tutorial you cannot switch off is worse than no tutorial for
 * anyone who asked their OS for less movement.
 */

const BOX = 'h-full w-full'

/** A miniature board the gesture happens on. */
function Board({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={BOX} fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="17"
        rx="2"
        className="stroke-border"
        strokeWidth="1"
        fill="none"
      />
      {children}
    </svg>
  )
}

/** Dashes long enough to hide the whole path, so it can be revealed. */
const draw = (repeat: boolean) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: repeat
    ? { pathLength: 1, opacity: 1 }
    : { pathLength: 1, opacity: 1 },
  transition: repeat
    ? { duration: 1.1, ease: 'easeInOut' as const, repeat: Infinity, repeatDelay: 0.9 }
    : { duration: 0 },
})

/** A cut line drawn across the board — the custom-layout gesture. */
export function SplitDemo() {
  const still = useReducedMotion()
  return (
    <Board>
      <m.path
        d="M12 4.5V19.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        {...draw(!still)}
      />
      <m.circle
        r="1.4"
        cx="12"
        cy="19.5"
        className="fill-accent"
        initial={{ opacity: still ? 1 : 0 }}
        animate={still ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
        transition={
          still ? undefined : { duration: 2, repeat: Infinity, times: [0, 0.15, 0.55, 0.7] }
        }
      />
    </Board>
  )
}

/** Two fingers moving apart — pinch to zoom. */
export function PinchDemo() {
  const still = useReducedMotion()
  const spread = { duration: 1.6, repeat: Infinity, repeatType: 'reverse' as const }
  return (
    <Board>
      <m.circle
        r="1.6"
        cy="12"
        className="fill-accent"
        initial={{ cx: still ? 7 : 10 }}
        animate={still ? { cx: 7 } : { cx: 7 }}
        transition={still ? undefined : spread}
      />
      <m.circle
        r="1.6"
        cy="12"
        className="fill-accent"
        initial={{ cx: still ? 17 : 14 }}
        animate={still ? { cx: 17 } : { cx: 17 }}
        transition={still ? undefined : spread}
      />
    </Board>
  )
}

/** A photo sliding inside a fixed frame — per-cell pan. */
export function CellPanDemo() {
  const still = useReducedMotion()
  return (
    <svg viewBox="0 0 24 24" className={BOX} fill="none" aria-hidden="true">
      <defs>
        <clipPath id="cell-pan-clip">
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#cell-pan-clip)">
        <m.rect
          y="4"
          width="18"
          height="16"
          className="fill-accent/30"
          initial={{ x: still ? 4 : 2 }}
          animate={still ? { x: 4 } : { x: [2, 8, 2] }}
          transition={still ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  )
}

/** One tile moving past another — drag to reorder. */
export function ReorderDemo() {
  const still = useReducedMotion()
  const trip = { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const }
  return (
    <svg viewBox="0 0 24 24" className={BOX} fill="none" aria-hidden="true">
      <m.rect
        x="5"
        width="14"
        height="5"
        rx="1.5"
        className="fill-accent"
        initial={{ y: still ? 13 : 4 }}
        animate={still ? { y: 13 } : { y: [4, 13, 4] }}
        transition={still ? undefined : trip}
      />
      <m.rect
        x="5"
        width="14"
        height="5"
        rx="1.5"
        className="fill-muted/40"
        initial={{ y: still ? 4 : 13 }}
        animate={still ? { y: 4 } : { y: [13, 4, 13] }}
        transition={still ? undefined : trip}
      />
    </svg>
  )
}

export const DEMOS = {
  split: SplitDemo,
  pinch: PinchDemo,
  cellPan: CellPanDemo,
  reorder: ReorderDemo,
} as const

export type DemoId = keyof typeof DEMOS
