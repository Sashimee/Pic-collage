import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Maximize, ChevronUp } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'

export function ZoomControls() {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const zoom = useEditor((s) => s.canvasZoom)
  const setZoom = useEditor((s) => s.setCanvasZoom)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-sm font-bold text-text shadow-lg backdrop-blur-sm transition hover:bg-surface-2 active:scale-95 sm:bottom-6 sm:right-6"
        title={t('aria.zoomIn') + ' / ' + t('aria.zoomOut')}
        aria-label={`Zoom ${Math.round(zoom * 100)}% — ${t('aria.zoomIn')} / ${t('aria.zoomOut')}`}
      >
        <span className="tabular-nums">{Math.round(zoom * 100)}</span>
        <span className="text-[0.6rem]">%</span>
      </button>
    )
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-1 sm:bottom-6 sm:right-6">
      <button
        onClick={() => setExpanded(false)}
        className="flex h-7 w-10 items-center justify-center rounded-full bg-surface/90 text-text/60 shadow backdrop-blur-sm transition hover:text-text"
        aria-label={t('common.close')}
      >
        <ChevronUp size={14} />
      </button>
      <div className="flex items-center gap-1 rounded-xl bg-surface/90 p-1 shadow-lg backdrop-blur-sm sm:gap-1.5 sm:p-1.5">
        <button
          title={t('aria.zoomOut')}
          onClick={() => setZoom(zoom - 0.1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
          aria-label={t('aria.zoomOut')}
        >
          <ZoomOut size={16} strokeWidth={2.5} />
        </button>
        <span className="min-w-[2.5rem] text-center text-sm font-bold text-text tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          title={t('aria.zoomIn')}
          onClick={() => setZoom(zoom + 0.1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
          aria-label={t('aria.zoomIn')}
        >
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>
        <button
          title={t('aria.resetZoom')}
          onClick={() => setZoom(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
          aria-label={t('aria.resetZoom')}
        >
          <RotateCcw size={14} strokeWidth={2.5} />
        </button>
        <button
          title={t('aria.fitScreen')}
          onClick={() => setZoom(0.8)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
          aria-label={t('aria.fitScreen')}
        >
          <Maximize size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
