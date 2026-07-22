import { Minus, Undo, Trash2, Magnet, Check, X } from 'lucide-react'
import { useT } from '../i18n/useLang'

interface Props {
  tool: 'horizontal' | 'vertical'
  snapEnabled: boolean
  canUndo: boolean
  onToolChange: (tool: 'horizontal' | 'vertical') => void
  onUndo: () => void
  onClear: () => void
  onSnapToggle: () => void
  onApply: () => void
  onCancel: () => void
}

export function CustomLayoutToolbar({
  tool,
  snapEnabled,
  canUndo,
  onToolChange,
  onUndo,
  onClear,
  onSnapToggle,
  onApply,
  onCancel,
}: Props) {
  const t = useT()
  return (
    <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl bg-surface/90 px-3 py-2 shadow-lg backdrop-blur">
      <button
        onClick={() => onToolChange('horizontal')}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
          tool === 'horizontal' ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
        }`}
        title={t('customLayout.horizontal')}
      >
        <Minus size={16} />
        <span className="hidden sm:inline">H</span>
      </button>
      <button
        onClick={() => onToolChange('vertical')}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
          tool === 'vertical' ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
        }`}
        title={t('customLayout.vertical')}
      >
        <Minus size={16} className="rotate-90" />
        <span className="hidden sm:inline">V</span>
      </button>
      <div className="mx-1 h-5 w-px bg-border" />
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
          canUndo ? 'text-text hover:bg-surface-2' : 'text-muted/40'
        }`}
        title={t('customLayout.undo')}
      >
        <Undo size={16} />
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-text transition hover:bg-surface-2"
        title={t('customLayout.clear')}
      >
        <Trash2 size={16} />
      </button>
      <button
        onClick={onSnapToggle}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
          snapEnabled ? 'bg-accent text-accent-fg' : 'text-text hover:bg-surface-2'
        }`}
        title={t('customLayout.snap')}
      >
        <Magnet size={16} />
      </button>
      <div className="mx-1 h-5 w-px bg-border" />
      <button
        onClick={onApply}
        className="flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-fg shadow transition hover:brightness-110 active:scale-95"
        title={t('customLayout.apply')}
      >
        <Check size={16} />
        <span className="hidden sm:inline">Apply</span>
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-text transition hover:bg-surface-2"
        title={t('customLayout.cancel')}
      >
        <X size={16} />
        <span className="hidden sm:inline">Cancel</span>
      </button>
    </div>
  )
}
