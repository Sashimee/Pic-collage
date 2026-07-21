import { useState, useRef, useCallback, useMemo } from 'react'
import { Eye, EyeOff, Lock, LockOpen, GripVertical } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import type { CanvasElement } from '../types'

const ROW_HEIGHT = 44
const OVERSCAN = 2
const VIEWPORT_ROWS = 20

function typeIcon(el: CanvasElement): string {
  switch (el.type) {
    case 'photo':
      return '🖼️'
    case 'text':
      return '✏️'
    case 'sticker':
      return (el as any).emoji ?? '🎴'
    case 'drawing':
      return '🎨'
    case 'shape':
      return '🔷'
    case 'group':
      return '📁'
    default:
      return '📄'
  }
}

function previewText(el: CanvasElement): string {
  switch (el.type) {
    case 'photo':
      return 'Photo'
    case 'text': {
      const txt = ((el as any).text as string) ?? ''
      return txt.slice(0, 28) || 'Text'
    }
    case 'sticker':
      return 'Sticker'
    case 'drawing':
      return 'Drawing'
    case 'shape': {
      const st = ((el as any).shapeType as string) ?? ''
      return st.charAt(0).toUpperCase() + st.slice(1) || 'Shape'
    }
    case 'group':
      return 'Group'
    default:
      return 'Layer'
  }
}

export default function LayerPanel() {
  const t = useT()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [dragId, setDragId] = useState<string | null>(null)

  const elements = useEditor((s) => s.elements)
  const selectedId = useEditor((s) => s.selectedId)
  const select = useEditor((s) => s.select)
  const setElementHidden = useEditor((s) => s.setElementHidden)
  const setElementLocked = useEditor((s) => s.setElementLocked)
  const bringForward = useEditor((s) => s.bringForward)
  const sendBackward = useEditor((s) => s.sendBackward)

  // Bottom-to-top display order
  const displayElements = useMemo(() => [...elements].reverse(), [elements])
  const totalHeight = displayElements.length * ROW_HEIGHT

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(
    displayElements.length - 1,
    Math.floor((scrollTop + VIEWPORT_ROWS * ROW_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  )

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop)
    }
  }, [])

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDragId(id)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    },
    [],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!dragId || dragId === targetId) {
        setDragId(null)
        return
      }

      const fromIndex = displayElements.findIndex((el) => el.id === dragId)
      const toIndex = displayElements.findIndex((el) => el.id === targetId)
      if (fromIndex === -1 || toIndex === -1) {
        setDragId(null)
        return
      }

      const diff = toIndex - fromIndex
      const action = diff > 0 ? bringForward : sendBackward
      const count = Math.abs(diff)
      for (let i = 0; i < count; i++) {
        action(dragId)
      }
      setDragId(null)
    },
    [dragId, displayElements, bringForward, sendBackward],
  )

  const handleDragEnd = useCallback(() => {
    setDragId(null)
  }, [])

  // Keep dragged element rendered even if it scrolls outside viewport
  const visibleIndices = useMemo(() => {
    const set = new Set<number>()
    for (let i = startIndex; i <= endIndex; i++) set.add(i)
    if (dragId) {
      const idx = displayElements.findIndex((e) => e.id === dragId)
      if (idx !== -1) set.add(idx)
    }
    return Array.from(set).sort((a, b) => a - b)
  }, [startIndex, endIndex, dragId, displayElements])

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          {t('layer.title')}
        </h3>
        <span className="text-[0.65rem] text-muted">{displayElements.length}</span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto no-scrollbar"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleIndices.map((index) => {
            const el = displayElements[index]
            const top = index * ROW_HEIGHT
            const isSelected = selectedId === el.id
            const hidden = (el as any).hidden ?? false
            const locked = (el as any).locked ?? false
            const isDragging = dragId === el.id

            return (
              <div
                key={el.id}
                draggable
                onDragStart={(e) => {
                  const target = e.target as HTMLElement
                  if (!target.closest('[data-drag-handle]')) {
                    e.preventDefault()
                    return
                  }
                  handleDragStart(e, el.id)
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, el.id)}
                onDragEnd={handleDragEnd}
                onClick={() => select(el.id)}
                className={`absolute left-0 right-0 flex items-center gap-2 rounded-lg border px-2 transition ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-transparent bg-surface-2 hover:bg-surface-3'
                } ${hidden ? 'opacity-50' : 'opacity-100'} ${
                  isDragging ? 'opacity-40' : ''
                }`}
                style={{ top, height: ROW_HEIGHT }}
              >
                <div
                  data-drag-handle
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-grab active:cursor-grabbing text-muted shrink-0"
                >
                  <GripVertical size={16} />
                </div>

                <span className="text-base shrink-0 select-none">{typeIcon(el)}</span>

                <span className="flex-1 truncate text-sm text-text/80 select-none">
                  {previewText(el)}
                </span>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setElementHidden(el.id, !hidden)
                    }}
                    title={hidden ? t('layer.show') : t('layer.hide')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setElementLocked(el.id, !locked)
                    }}
                    title={locked ? t('layer.unlock') : t('layer.lock')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text/60 transition hover:bg-surface-3 hover:text-text"
                  >
                    {locked ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
