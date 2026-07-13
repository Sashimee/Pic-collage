import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'

// Floating contextual actions for the currently selected element.
export function SelectionBar() {
  const t = useT()
  const selectedId = useEditor((s) => s.selectedId)
  const mode = useEditor((s) => s.mode)
  const selected = useEditor((s) => s.selected)
  const remove = useEditor((s) => s.removeElement)
  const duplicate = useEditor((s) => s.duplicateElement)
  const forward = useEditor((s) => s.bringForward)
  const backward = useEditor((s) => s.sendBackward)
  const updateElement = useEditor((s) => s.updateElement)

  if (!selectedId) return null

  const el = selected()
  const isGridPhoto = mode === 'grid' && el?.type === 'photo'

  const stepZoom = (delta: number) => {
    if (el?.type !== 'photo') return
    const next = Math.max(1, Math.min(4, (el.cellZoom ?? 1) + delta))
    updateElement(el.id, { cellZoom: next })
  }
  const resetCell = () =>
    el?.type === 'photo' &&
    updateElement(el.id, { cellZoom: 1, cellPan: { x: 0, y: 0 } })

  const Btn = ({
    onClick,
    children,
    label,
    danger,
  }: {
    onClick: () => void
    children: string
    label?: string
    danger?: boolean
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
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
        {isGridPhoto && (
          <>
            <Btn onClick={() => stepZoom(-0.2)} label={t('cell.zoomOut')}>
              －
            </Btn>
            <Btn onClick={() => stepZoom(0.2)} label={t('cell.zoomIn')}>
              ＋
            </Btn>
            <Btn onClick={resetCell} label={t('cell.reset')}>
              ⟲
            </Btn>
          </>
        )}
        <Btn onClick={() => remove(selectedId)} danger>
          🗑️
        </Btn>
      </div>
    </div>
  )
}
