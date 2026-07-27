import { Undo, Trash2, Magnet, Check, X, Scissors, Circle, Layers } from 'lucide-react'
import { useT } from '../i18n/useLang'
import type { LayoutTool } from './CustomLayoutEditor'

interface Props {
  snapEnabled: boolean
  canUndo: boolean
  zoneCount: number
  gap: number
  tool: LayoutTool
  circleOverlay: boolean
  onToolChange: (tool: LayoutTool) => void
  onCircleOverlayToggle: () => void
  onGapChange: (gap: number) => void
  onUndo: () => void
  onClear: () => void
  onSnapToggle: () => void
  onApply: () => void
  onCancel: () => void
}

const iconBtn =
  'flex shrink-0 items-center rounded-xl px-2.5 py-2 text-xs font-medium transition'

export function CustomLayoutToolbar({
  snapEnabled,
  canUndo,
  zoneCount,
  gap,
  tool,
  circleOverlay,
  onToolChange,
  onCircleOverlayToggle,
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
      <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur no-scrollbar">
          {/* Tool: straight/oblique cut vs. round zone */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface-2 p-0.5">
            <button
              onClick={() => onToolChange('cut')}
              aria-pressed={tool === 'cut'}
              className={`${iconBtn} ${
                tool === 'cut' ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-3'
              }`}
              title={t('customLayout.toolCut')}
            >
              <Scissors size={16} />
            </button>
            <button
              onClick={() => onToolChange('circle')}
              aria-pressed={tool === 'circle'}
              className={`${iconBtn} ${
                tool === 'circle' ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-3'
              }`}
              title={t('customLayout.toolCircle')}
            >
              <Circle size={16} />
            </button>
          </div>

          {tool === 'circle' && (
            <button
              onClick={onCircleOverlayToggle}
              aria-pressed={circleOverlay}
              className={`${iconBtn} gap-1 ${
                circleOverlay ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
              }`}
              title={t('customLayout.overlay')}
            >
              <Layers size={16} />
              <span className="hidden sm:inline">{t('customLayout.overlay')}</span>
            </button>
          )}

          <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />

          {tool === 'cut' && (
            <button
              onClick={onSnapToggle}
              aria-pressed={snapEnabled}
              className={`${iconBtn} ${
                snapEnabled ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
              }`}
              title={t('customLayout.snap')}
            >
              <Magnet size={16} />
            </button>
          )}

          <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`${iconBtn} ${canUndo ? 'text-text hover:bg-surface-2' : 'text-muted/40'}`}
            title={t('customLayout.undo')}
          >
            <Undo size={16} />
          </button>
          <button
            onClick={onClear}
            className={`${iconBtn} text-text hover:bg-surface-2`}
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
            className={`${iconBtn} text-text hover:bg-surface-2`}
            title={t('customLayout.cancel')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Secondary controls + hint live below the board, so the top row always
          has room for Apply/Cancel even on a narrow phone. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex flex-col items-center gap-1.5 px-3">
        <p className="max-w-sm rounded-xl bg-surface/85 px-3 py-1.5 text-center text-[0.7rem] font-medium text-muted shadow backdrop-blur">
          {tool === 'circle' ? t('customLayout.hintCircle') : t('customLayout.hint')}
        </p>
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-surface/95 px-3 py-1.5 shadow-lg backdrop-blur">
          <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-semibold text-text">
            {zoneCount}
          </span>
          <label className="flex items-center gap-1.5">
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
              className="h-1 w-24 accent-accent"
              aria-label={t('customLayout.padding')}
            />
          </label>
        </div>
      </div>
    </>
  )
}
