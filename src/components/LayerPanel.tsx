import { useState, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  GripVertical,
  Layers,
  Group,
  Ungroup,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react'
import { Reorder, AnimatePresence, m } from 'framer-motion'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import type { CanvasElement } from '../types'

const TAP = { scale: 0.94 }

function layerLabel(el: CanvasElement) {
  switch (el.type) {
    case 'photo':
      return '🖼️ Photo'
    case 'text':
      return '✏️ Text'
    case 'sticker':
      return '🎴 ' + (el as any).emoji
    case 'drawing':
      return '🎨 Drawing'
    default:
      return 'Layer'
  }
}

export default function LayerPanel() {
  const t = useT()
  const elements = useEditor((s) => s.elements)
  const selectedId = useEditor((s) => s.selectedId)
  const select = useEditor((s) => s.select)
  const setElementHidden = useEditor((s) => s.setElementHidden)
  const setElementLocked = useEditor((s) => s.setElementLocked)
  const bringForward = useEditor((s) => s.bringForward)
  const sendBackward = useEditor((s) => s.sendBackward)
  const bringToFront = useEditor((s) => s.bringToFront)
  const sendToBack = useEditor((s) => s.sendToBack)
  const setElements = useEditor((s) => s.setElements)
  const groupElements = useEditor((s) => s.groupElements)
  const ungroupElements = useEditor((s) => s.ungroupElements)

  const [multi, setMulti] = useState<Set<string>>(new Set())

  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl) {
        setMulti((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      } else {
        setMulti(new Set())
        select(id)
      }
    },
    [select],
  )

  const handleReorder = (newOrder: CanvasElement[]) => {
    setElements(newOrder)
  }

  const canGroup =
    multi.size >= 2 &&
    Array.from(multi).every((id) => {
      const el = elements.find((e) => e.id === id)
      return !el?.groupId
    })

  const activeGroupId = selectedId
    ? elements.find((e) => e.id === selectedId)?.groupId
    : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          {t('layer.title')}
        </h3>
        <div className="flex items-center gap-1">
          {canGroup && (
            <m.button
              whileTap={TAP}
              onClick={() => {
                groupElements(Array.from(multi))
                setMulti(new Set())
              }}
              title={t('layer.group')}
              className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-surface-2 text-text/70 transition hover:bg-surface-3 hover:text-text"
            >
              <Group size={16} />
            </m.button>
          )}
          {activeGroupId && (
            <m.button
              whileTap={TAP}
              onClick={() => ungroupElements(activeGroupId)}
              title={t('layer.ungroup')}
              className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-surface-2 text-text/70 transition hover:bg-surface-3 hover:text-text"
            >
              <Ungroup size={16} />
            </m.button>
          )}
          <m.button
            whileTap={TAP}
            onClick={() => selectedId && bringToFront(selectedId)}
            disabled={!selectedId}
            title={t('sel.forward')}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-surface-2 text-text/70 transition hover:bg-surface-3 hover:text-text disabled:opacity-30"
          >
            <ArrowUpToLine size={16} />
          </m.button>
          <m.button
            whileTap={TAP}
            onClick={() => selectedId && sendToBack(selectedId)}
            disabled={!selectedId}
            title={t('sel.backward')}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-surface-2 text-text/70 transition hover:bg-surface-3 hover:text-text disabled:opacity-30"
          >
            <ArrowDownToLine size={16} />
          </m.button>
        </div>
      </div>

      <p className="text-xs text-muted">{t('layer.selectHint')}</p>

      <Reorder.Group
        axis="y"
        values={elements}
        onReorder={handleReorder}
        className="flex flex-col gap-1"
      >
        <AnimatePresence>
          {[...elements].reverse().map((el) => {
            const isSelected = selectedId === el.id || multi.has(el.id)
            const hidden = (el as any).hidden ?? false
            const locked = (el as any).locked ?? false
            const groupId = (el as any).groupId as string | undefined
            const inGroup = !!groupId

            return (
              <Reorder.Item
                key={el.id}
                value={el}
                dragListener={false}
                className={`flex items-center gap-1 rounded-xl border px-2 py-2 transition ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-transparent bg-surface-2 hover:bg-surface-3'
                } ${hidden ? 'opacity-50' : 'opacity-100'}`}
              >
                <div
                  className="cursor-grab active:cursor-grabbing text-muted"
                  {...({
                    onPointerDown: (e: any) =>
                      (e.target as HTMLElement).closest('[data-reorder-handle]')?.setAttribute('data-dragging', 'true'),
                  } as any)}
                  data-reorder-handle
                >
                  <GripVertical size={16} />
                </div>

                <button
                  onClick={(e) => handleSelect(el.id, e)}
                  className={`flex flex-1 items-center gap-2 text-left text-sm ${
                    isSelected ? 'font-semibold text-accent' : 'text-text/80'
                  }`}
                >
                  <Layers size={14} className={inGroup ? 'text-accent' : 'text-muted'} />
                  <span className="truncate">
                    {layerLabel(el)}
                    {inGroup && (
                      <span className="ml-1 text-[0.65rem] text-accent">({groupId.slice(0, 4)})</span>
                    )}
                  </span>
                </button>

                <div className="flex items-center gap-0.5">
                  <m.button
                    whileTap={TAP}
                    onClick={() => setElementHidden(el.id, !hidden)}
                    title={hidden ? t('layer.show') : t('layer.hide')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </m.button>

                  <m.button
                    whileTap={TAP}
                    onClick={() => setElementLocked(el.id, !locked)}
                    title={locked ? t('layer.unlock') : t('layer.lock')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    {locked ? <Lock size={14} /> : <LockOpen size={14} />}
                  </m.button>

                  <m.button
                    whileTap={TAP}
                    onClick={() => bringForward(el.id)}
                    title={t('sel.forward')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    <ChevronUp size={14} />
                  </m.button>

                  <m.button
                    whileTap={TAP}
                    onClick={() => sendBackward(el.id)}
                    title={t('sel.backward')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    <ChevronDown size={14} />
                  </m.button>
                </div>
              </Reorder.Item>
            )
          })}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  )
}
