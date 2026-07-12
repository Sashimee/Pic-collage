import { useState } from 'react'
import { useEditor } from '../store/editorStore'
import { canShareImage } from '../lib/exportImage'
import { clearPersisted } from '../lib/persistence'
import { useT } from '../i18n/useLang'
import { useTheme } from '../i18n/useTheme'
import { LangSwitcher } from './LangSwitcher'
import { IconButton } from './ui'

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
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggleTheme)

  const pick = (kind: ExportKind) => {
    setMenu(false)
    onExport(kind)
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 pt-[calc(env(safe-area-inset-top)+0.55rem)]">
      <h1 className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold">
        <span className="text-base">🎨</span>
        <span className="hidden bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent sm:inline">
          Pic Collage Maker
        </span>
      </h1>

      <div className="flex items-center gap-1">
        <IconButton onClick={undo} disabled={!canUndo} label={t('header.undo')}>
          ↶
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo} label={t('header.redo')}>
          ↷
        </IconButton>

        <span className="mx-0.5 h-6 w-px bg-border" />

        <IconButton
          onClick={toggleTheme}
          label={t('header.theme')}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </IconButton>
        <LangSwitcher />

        <IconButton
          onClick={() => {
            if (hasElements && window.confirm(t('header.clearConfirm'))) {
              clearAll()
              void clearPersisted()
            }
          }}
          disabled={!hasElements}
          label={t('header.new')}
        >
          🗑️
        </IconButton>

        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="min-h-[40px] whitespace-nowrap rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-sm shadow-accent/30 transition hover:brightness-110 active:scale-95"
          >
            {t('header.export')}
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl">
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
      className="block min-h-[44px] w-full px-4 py-3 text-left text-sm text-text/90 transition hover:bg-surface-3"
    >
      {children}
    </button>
  )
}
