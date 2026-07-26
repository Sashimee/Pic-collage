import type { ReactNode } from 'react'
import { sfx } from '../audio/sfx'

/**
 * UI primitives.
 *
 * Two rules run through all of them, both from the 6–7 age target:
 *  - **nothing smaller than 64px.** Small fingers, imprecise aim.
 *  - **never text alone.** Every control carries an emoji or shape that means
 *    the same thing, so a child who cannot read yet can still play.
 */

export function BigButton({
  children,
  onClick,
  tone = 'primary',
  label,
}: {
  children: ReactNode
  onClick: () => void
  tone?: 'primary' | 'secondary'
  /** Screen-reader label, when the visible content is mostly emoji. */
  label?: string
}) {
  const palette =
    tone === 'primary'
      ? 'bg-gradient-to-b from-pink-400 to-fuchsia-600 border-pink-200'
      : 'bg-gradient-to-b from-violet-400/90 to-violet-700/90 border-violet-200'

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className={`${palette} min-h-16 rounded-3xl border-4 px-7 py-4 text-2xl font-bold text-white
        shadow-[0_8px_0_rgba(0,0,0,0.22)] transition active:translate-y-1
        active:shadow-[0_3px_0_rgba(0,0,0,0.22)]`}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  onClick,
  label,
}: {
  children: ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/40
        bg-white/15 text-3xl backdrop-blur-sm transition active:scale-95"
    >
      {children}
    </button>
  )
}

/** Star counter. `max` fills the row with empty slots for the result screen. */
export function StarRow({ count, max, size = 'md' }: { count: number; max?: number; size?: 'md' | 'lg' }) {
  const slots = max ?? count
  const cls = size === 'lg' ? 'text-6xl' : 'text-2xl'
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${count} / ${slots}`}>
      {Array.from({ length: slots }, (_, i) => (
        <span
          key={i}
          className={`${cls} ${i < count ? 'animate-pop-in' : 'opacity-25 grayscale'}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}

/** A wardrobe card: big, tappable, and obviously locked or not. */
export function PickCard({
  badge,
  name,
  selected,
  locked,
  lockedLabel,
  onClick,
}: {
  badge: string
  name?: string
  selected: boolean
  locked: boolean
  lockedLabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={locked}
      aria-label={locked ? `${name ?? badge} — ${lockedLabel ?? ''}` : name ?? badge}
      aria-pressed={selected}
      onClick={() => {
        sfx.tap()
        onClick()
      }}
      className={`relative flex h-24 w-24 flex-col items-center justify-center rounded-3xl border-4
        transition active:scale-95
        ${selected ? 'border-yellow-300 bg-white/25' : 'border-white/25 bg-white/10'}
        ${locked ? 'opacity-60' : ''}`}
    >
      <span className="text-4xl">{locked ? '🔒' : badge}</span>
      {locked ? (
        <span className="mt-1 text-xs font-bold text-yellow-200">{lockedLabel}</span>
      ) : (
        name && <span className="mt-1 text-xs font-semibold text-white/90">{name}</span>
      )}
    </button>
  )
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border-4 border-white/25 bg-black/35 p-5 backdrop-blur-md">
      {children}
    </div>
  )
}
