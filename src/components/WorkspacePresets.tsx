import { Layout, Minimize, Maximize } from 'lucide-react'
import { useWorkspace } from '../store/workspaceStore'

const PRESETS = [
  { id: 'editing', label: 'Editing', Icon: Layout },
  { id: 'review', label: 'Review', Icon: Maximize },
  { id: 'minimal', label: 'Minimal', Icon: Minimize },
] as const

export function WorkspacePresets() {
  const applyPreset = useWorkspace((s) => s.applyPreset)

  return (
    <div className="flex gap-2">
      {PRESETS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => applyPreset?.(id)}
          className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text transition hover:bg-surface-3"
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
