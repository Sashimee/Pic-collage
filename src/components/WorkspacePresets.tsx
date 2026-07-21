import { Layout, Minimize, Maximize, RotateCcw } from 'lucide-react'
import { useWorkspace } from '../store/workspaceStore'
import { useT } from '../i18n/useLang'

const PRESETS = [
  { id: 'editing', labelKey: 'workspace.presetEditing', Icon: Layout },
  { id: 'review', labelKey: 'workspace.presetReview', Icon: Maximize },
  { id: 'minimal', labelKey: 'workspace.presetMinimal', Icon: Minimize },
] as const

export function WorkspacePresets() {
  const t = useT()
  const applyPreset = useWorkspace((s) => s.applyPreset)
  const resetWorkspace = useWorkspace((s) => s.resetWorkspace)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {PRESETS.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            onClick={() => applyPreset?.(id)}
            className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text transition hover:bg-surface-3"
          >
            <Icon size={14} />
            {t(labelKey)}
          </button>
        ))}
      </div>
      <button
        onClick={() => resetWorkspace?.()}
        className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:bg-surface-2"
      >
        <RotateCcw size={12} />
        {t('workspace.reset')}
      </button>
    </div>
  )
}
