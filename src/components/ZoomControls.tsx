import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react'
import { useEditor } from '../store/editorStore'

export function ZoomControls() {
  const zoom = useEditor((s) => s.canvasZoom)
  const setZoom = useEditor((s) => s.setCanvasZoom)

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-xl bg-surface/90 p-1 shadow-lg backdrop-blur-sm sm:bottom-6 sm:right-6 sm:gap-1.5 sm:p-1.5">
      <button
        title="Zoom out"
        onClick={() => setZoom(zoom - 0.1)}
        className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} strokeWidth={2.5} />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-bold text-text tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        title="Zoom in"
        onClick={() => setZoom(zoom + 0.1)}
        className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} strokeWidth={2.5} />
      </button>
      <button
        title="Reset zoom"
        onClick={() => setZoom(1)}
        className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
        aria-label="Reset zoom"
      >
        <RotateCcw size={16} strokeWidth={2.5} />
      </button>
      <button
        title="Fit to screen"
        onClick={() => setZoom(0.8)}
        className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95"
        aria-label="Fit to screen"
      >
        <Maximize size={16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
