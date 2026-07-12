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

  const Btn = ({
    onClick,
    children,
    danger,
  }: {
    onClick: () => void
    children: string
    danger?: boolean
  }) => (
    <button
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-lg backdrop-blur transition active:scale-90 ${
        danger
          ? 'bg-danger/90 text-white'
          : 'bg-surface-2/90 text-text hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <div className="pointer-events-auto flex gap-2 rounded-full bg-surface/80 p-1.5 shadow-xl ring-1 ring-border backdrop-blur">
        {mode === 'free' && (
          <>
            <Btn onClick={() => duplicate(selectedId)}>⧉</Btn>
            <Btn onClick={() => backward(selectedId)}>⤵</Btn>
            <Btn onClick={() => forward(selectedId)}>⤴</Btn>
          </>
        )}
        <Btn onClick={() => remove(selectedId)} danger>
          🗑️
        </Btn>
      </div>
    </div>
  )
}
