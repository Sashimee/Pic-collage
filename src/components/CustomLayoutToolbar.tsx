import { Undo, Trash2, Magnet, Check, X } from 'lucide-react'
import { useT } from '../i18n/useLang'

interface Props {
  snapEnabled: boolean
  canUndo: boolean
  zoneCount: number
  gap: number
  onGapChange: (gap: number) => void
  onUndo: () => void
  onClear: () => void
  onSnapToggle: () => void
  onApply: () => void
  onCancel: () => void
}

export function CustomLayoutToolbar({
  snapEnabled,
  canUndo,
  zoneCount,
  gap,
  onGapChange,
  onUndo,
  onClear,
  onSnapToggle,
  onApply,
  onCancel,
}: Props) {
  const t = useT()
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-surface/95 px-2 py-2 shadow-lg backdrop-blur no-scrollbar">
        <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-text">
          {zoneCount}
        </span>
        <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />

        {/* Padding between zones */}
        <label className="flex shrink-0 items-center gap-1.5 px-1.5">
          <span className="text-[0.65rem] font-medium text-muted">
            {t('customLayout.padding')}
          </span>
          <input
            type="range"
            min={0}
            max={60}
            step={2}
            value={gap}
            onChange={(e) => onGapChange(Number(e.target.value))}
            className="h-1 w-16 accent-accent sm:w-24"
            aria-label={t('customLayout.padding')}
          />
        </label>

        <button
          onClick={onSnapToggle}
          aria-pressed={snapEnabled}
          className={`flex shrink-0 items-center rounded-xl px-2.5 py-2 text-xs font-medium transition ${
            snapEnabled ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
          }`}
          title={t('customLayout.snap')}
        >
          <Magnet size={16} />
        </button>
        <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex shrink-0 items-center rounded-xl px-2.5 py-2 text-xs font-medium transition ${
            canUndo ? 'text-text hover:bg-surface-2' : 'text-muted/40'
          }`}
          title={t('customLayout.undo')}
        >
          <Undo size={16} />
        </button>
        <button
          onClick={onClear}
          className="flex shrink-0 items-center rounded-xl px-2.5 py-2 text-xs font-medium text-text transition hover:bg-surface-2"
          title={t('customLayout.clear')}
        >
          <Trash2 size={16} />
        </button>
        <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
        <button
          onClick={onApply}
          disabled={zoneCount < 2}
          className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold shadow transition active:scale-95 ${
            zoneCount < 2
              ? 'bg-surface-2 text-muted/50'
              : 'bg-accent text-accent-fg hover:brightness-110'
          }`}
          title={t('customLayout.apply')}
        >
          <Check size={16} />
          <span className="hidden sm:inline">{t('customLayout.apply')}</span>
        </button>
        <button
          onClick={onCancel}
          className="flex shrink-0 items-center rounded-xl px-2.5 py-2 text-xs font-medium text-text transition hover:bg-surface-2"
          title={t('customLayout.cancel')}
        >
          <X size={16} />
        </button>
        </div>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-3 z-30 mx-auto max-w-sm rounded-xl bg-surface/85 px-3 py-1.5 text-center text-[0.7rem] font-medium text-muted shadow backdrop-blur">
        {t('customLayout.hint')}
      </p>
    </>
  )
}
