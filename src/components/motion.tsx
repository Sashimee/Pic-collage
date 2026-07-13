// Centralised framer-motion surface. We use LazyMotion + the `m` component so
// only the DOM animation features are bundled (keeps the payload trimmed vs.
// importing the full `motion`). Wrap the app once in <MotionProvider> (App.tsx)
// and use <m.div .../> everywhere else.
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

export { m, AnimatePresence }

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
