import { useState } from 'react'
import { useEditor } from '../store/editorStore'
import { canShareImage } from '../lib/exportImage'
import { useT } from '../i18n/useLang'
import { LangSwitcher } from './LangSwitcher'

export type ExportKind = 'png' | 'jpg' | 'share'

export function HeaderBar({ onExport }: { onExport: (kind: ExportKind) => void }) {
  const [menu, setMenu] = useState(false)
  const t = useT()
  const clearAll = useEditor((s) => s.clearAll)
  const hasElements = useEditor((s) => s.elements.length > 0)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)

  const pick = (kind: ExportKind) => {
    setMenu(false)
    onExport(kind)
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2.5 pt-[calc(env(safe-area-inset-top)+0.6rem)]">
      <h1 className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold">
        <span className="text-base">🎨</span>
        <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          Pic Collage Maker
        </span>
      </h1>
      <div className="flex items-center gap-2">
        <LangSwitcher />
        <button
          onClick={undo}
          disabled={!canUndo}
          title={t('header.undo')}
          aria-label={t('header.undo')}
          className="min-h-[44px] rounded-lg px-3 py-2.5 text-base text-slate-300 transition hover:bg-slate-800 active:scale-95 active:bg-slate-700 disabled:opacity-30"
        >
          ↶
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={t('header.redo')}
          aria-label={t('header.redo')}
          className="min-h-[44px] rounded-lg px-3 py-2.5 text-base text-slate-300 transition hover:bg-slate-800 active:scale-95 active:bg-slate-700 disabled:opacity-30"
        >
          ↷
        </button>
        <button
          onClick={() => {
            if (hasElements && window.confirm(t('header.clearConfirm'))) clearAll()
          }}
          className="min-h-[44px] rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 active:scale-95 active:bg-slate-700 disabled:opacity-40"
          disabled={!hasElements}
        >
          {t('header.new')}
        </button>
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="min-h-[44px] whitespace-nowrap rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 active:scale-95 active:bg-indigo-600"
          >
            {t('header.export')}
          </button>
          {menu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenu(false)}
              />
              <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
                {canShareImage() && (
                  <MenuItem onClick={() => pick('share')}>{t('export.share')}</MenuItem>
                )}
                <MenuItem onClick={() => pick('png')}>{t('export.png')}</MenuItem>
                <MenuItem onClick={() => pick('jpg')}>{t('export.jpg')}</MenuItem>
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
      className="block min-h-[44px] w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-700 active:bg-slate-600"
    >
      {children}
    </button>
  )
}
