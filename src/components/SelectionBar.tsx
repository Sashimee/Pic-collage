import { useEditor } from '../store/editorStore'

// Floating contextual actions for the currently selected element.
export function SelectionBar() {
  const selectedId = useEditor((s) => s.selectedId)
  const mode = useEditor((s) => s.mode)
  const remove = useEditor((s) => s.removeElement)
  const duplicate = useEditor((s) => s.duplicateElement)
  const forward = useEditor((s) => s.bringForward)
  const backward = useEditor((s) => s.sendBackward)

  if (!selectedId) return null

  const Btn = ({ onClick, children }: { onClick: () => void; children: string }) => (
    <button
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/90 text-lg text-white shadow-lg backdrop-blur transition active:scale-90"
    >
      {children}
    </button>
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <div className="pointer-events-auto flex gap-2 rounded-full bg-slate-900/70 p-1.5 shadow-xl ring-1 ring-white/10">
        {mode === 'free' && (
          <>
            <Btn onClick={() => duplicate(selectedId)}>⧉</Btn>
            <Btn onClick={() => backward(selectedId)}>⤵</Btn>
            <Btn onClick={() => forward(selectedId)}>⤴</Btn>
          </>
        )}
        <Btn onClick={() => remove(selectedId)}>🗑️</Btn>
      </div>
    </div>
  )
}
