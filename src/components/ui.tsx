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
    <label className="flex flex-col gap-1 text-xs text-slate-300">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-slate-400">{Math.round(value * 100) / 100}</span>
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
    <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded border border-slate-600 bg-transparent"
      />
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
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
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
      className="min-h-[44px] rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 active:scale-95 active:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
