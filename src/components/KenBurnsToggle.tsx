import { useEditor } from '../store/editorStore'
import { Film } from 'lucide-react'

export function KenBurnsToggle() {
  const selected = useEditor((s) => s.selected?.())
  const updateElement = useEditor((s) => s.updateElement)
  if (selected?.type !== 'photo') return null

  const isOn = !!selected.kenBurns
  return (
    <button
      onClick={() => updateElement(selected.id, { kenBurns: !isOn })}
      className={\`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition \${
        isOn ? 'bg-accent text-white' : 'bg-surface-2 text-text hover:bg-surface-3'
      }\`}
    >
      <Film size={14} />
      Ken Burns
    </button>
  )
}
