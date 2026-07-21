import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'

export function StatusBar() {
  const t = useT()
  const boardWidth = useEditor((s) => s.boardWidth)
  const boardHeight = useEditor((s) => s.boardHeight)
  const elements = useEditor((s) => s.elements)
  const selected = useEditor((s) => s.selected?.())

  const selectedInfo = selected
    ? `${selected.type === 'photo' ? '📷' : selected.type === 'text' ? '🔤' : selected.type === 'sticker' ? '🙂' : '🖊'} ${Math.round(selected.x)},${Math.round(selected.y)}`
    : t('panel.pickTool')

  return (
    <footer className="hidden sm:flex items-center justify-between gap-4 border-t border-border/60 bg-surface/80 px-4 py-1.5 text-[11px] text-muted backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span>{boardWidth} × {boardHeight} px</span>
        <span className="h-3 w-px bg-border" />
        <span>{elements.length} {elements.length === 1 ? 'layer' : 'layers'}</span>
        <span className="h-3 w-px bg-border" />
        <span className="truncate max-w-[12rem]">{selectedInfo}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="opacity-60">Pic Collage v2</span>
      </div>
    </footer>
  )
}
