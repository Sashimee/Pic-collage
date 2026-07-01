import { useRef } from 'react'
import { EditorCanvas, type EditorHandle } from './components/EditorCanvas'
import { HeaderBar, type ExportKind } from './components/HeaderBar'
import { SelectionBar } from './components/SelectionBar'
import { Toolbar } from './components/Toolbar'
import { useEditor } from './store/editorStore'
import {
  downloadDataURL,
  shareDataURL,
  type ExportFormat,
} from './lib/exportImage'

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

export default function App() {
  const editorRef = useRef<EditorHandle>(null)
  const select = useEditor((s) => s.select)

  const handleExport = async (kind: ExportKind) => {
    // Drop the selection so transform handles / grid highlight aren't captured,
    // then wait a frame for the canvas to redraw before snapshotting.
    select(null)
    await nextFrame()
    const format: ExportFormat = kind === 'jpg' ? 'jpg' : 'png'
    const url = editorRef.current?.exportImage(format)
    if (!url) return
    if (kind === 'share') {
      const shared = await shareDataURL(url, format)
      if (!shared) downloadDataURL(url, format)
    } else {
      downloadDataURL(url, format)
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <HeaderBar onExport={handleExport} />
      <div className="relative min-h-0 flex-1 bg-slate-950">
        <EditorCanvas ref={editorRef} />
        <SelectionBar />
      </div>
      <Toolbar />
    </div>
  )
}
