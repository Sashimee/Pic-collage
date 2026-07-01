import { useState } from 'react'
import { useEditor } from '../store/editorStore'
import { canShareImage } from '../lib/exportImage'

export type ExportKind = 'png' | 'jpg' | 'share'

export function HeaderBar({ onExport }: { onExport: (kind: ExportKind) => void }) {
  const [menu, setMenu] = useState(false)
  const clearAll = useEditor((s) => s.clearAll)
  const hasElements = useEditor((s) => s.elements.length > 0)

  const pick = (kind: ExportKind) => {
    setMenu(false)
    onExport(kind)
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
      <h1 className="flex items-center gap-1.5 text-base font-bold">
        <span className="text-lg">🎨</span>
        <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          PicCollage
        </span>
      </h1>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (hasElements && window.confirm('Clear the whole canvas?')) clearAll()
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          disabled={!hasElements}
        >
          New
        </button>
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Export ▾
          </button>
          {menu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenu(false)}
              />
              <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
                {canShareImage() && (
                  <MenuItem onClick={() => pick('share')}>📤 Share…</MenuItem>
                )}
                <MenuItem onClick={() => pick('png')}>⬇️ Download PNG</MenuItem>
                <MenuItem onClick={() => pick('jpg')}>⬇️ Download JPG</MenuItem>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: string
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-700"
    >
      {children}
    </button>
  )
}
