import type { ReactNode } from 'react'
import {
  Copy,
  SendToBack,
  BringToFront,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Crop,
} from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import { m, AnimatePresence } from './motion'

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
  const setCropping = useEditor((s) => s.setCropping)

  const el = selected()
  const isGridPhoto = mode === 'grid' && el?.type === 'photo'
  const isFreePhoto = mode === 'free' && el?.type === 'photo'

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
    children: ReactNode
    label?: string
    danger?: boolean
  }) => (
    <m.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur transition ${
        danger
          ? 'bg-danger/90 text-white'
          : 'bg-surface-2/90 text-text hover:bg-surface-3'
      }`}
    >
      {children}
    </m.button>
  )

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <AnimatePresence>
        {selectedId && (
          <m.div
            key="selbar"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="pointer-events-auto flex gap-2 rounded-full bg-surface/80 p-1.5 shadow-xl ring-1 ring-border backdrop-blur"
          >
            {mode === 'free' && (
          <>
            <Btn onClick={() => duplicate(selectedId)} label={t('sel.duplicate')}>
              <Copy size={18} />
            </Btn>
            <Btn onClick={() => backward(selectedId)} label={t('sel.backward')}>
              <SendToBack size={18} />
            </Btn>
            <Btn onClick={() => forward(selectedId)} label={t('sel.forward')}>
              <BringToFront size={18} />
            </Btn>
          </>
        )}
        {isFreePhoto && (
          <Btn onClick={() => setCropping(selectedId)} label={t('sel.cropShape')}>
            <Crop size={18} />
          </Btn>
        )}
        {isGridPhoto && (
          <>
            <Btn onClick={() => stepZoom(-0.2)} label={t('cell.zoomOut')}>
              <ZoomOut size={18} />
            </Btn>
            <Btn onClick={() => stepZoom(0.2)} label={t('cell.zoomIn')}>
              <ZoomIn size={18} />
            </Btn>
            <Btn onClick={resetCell} label={t('cell.reset')}>
              <RotateCcw size={18} />
            </Btn>
          </>
        )}
            <Btn onClick={() => remove(selectedId)} label={t('sel.delete')} danger>
              <Trash2 size={18} />
            </Btn>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
