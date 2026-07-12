import type { ReactNode } from 'react'

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted">
      <span className="flex justify-between">
        <span className="font-medium text-text/80">{label}</span>
        <span className="tabular-nums text-muted">{Math.round(value * 100) / 100}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs font-medium text-text/80">
      <span>{label}</span>
      <span className="relative h-9 w-14 overflow-hidden rounded-lg border border-border">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer border-0 bg-transparent p-0"
        />
      </span>
    </label>
  )
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
        active
          ? 'bg-accent text-accent-fg shadow-sm shadow-accent/30'
          : 'bg-surface-2 text-text/80 hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-h-[44px] rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/30 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

// A titled group of controls — the backbone of the reorganized panels.
export function Section({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-2.5 ${className}`}>
      {title && (
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}

// Unified icon/action button used across the header and toolbars.
export function IconButton({
  onClick,
  children,
  label,
  disabled,
  active,
  variant = 'ghost',
}: {
  onClick: () => void
  children: ReactNode
  label: string
  disabled?: boolean
  active?: boolean
  variant?: 'ghost' | 'accent'
}) {
  const base =
    'flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 text-base font-medium transition active:scale-95 disabled:opacity-30 disabled:active:scale-100'
  const styles =
    variant === 'accent'
      ? 'bg-accent text-accent-fg shadow-sm shadow-accent/30 hover:brightness-110'
      : active
        ? 'bg-surface-3 text-text'
        : 'text-text/70 hover:bg-surface-2 hover:text-text'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  )
}
