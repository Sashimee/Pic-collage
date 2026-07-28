// Centralised framer-motion surface. We use LazyMotion + the `m` component so
// only the DOM animation features are bundled (keeps the payload trimmed vs.
// importing the full `motion`). Wrap the app once in <MotionProvider> (App.tsx)
// and use <m.div .../> everywhere else.
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
} from 'framer-motion'
import type { ReactNode } from 'react'

export { m, AnimatePresence, useDragControls, useReducedMotion }

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {/*
       * `prefers-reduced-motion` did not reach any of this. index.css zeroes
       * CSS animation and transition durations, and its comment claimed that
       * covered framer-motion — it does not: framer-motion animates by writing
       * inline transforms from a rAF loop, with no CSS transition involved, so
       * every spring in the app ran at full amplitude for anyone who had asked
       * the OS for less movement.
       */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
