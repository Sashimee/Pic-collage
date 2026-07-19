import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Undo2,
  Redo2,
  Sun,
  Moon,
  Trash2,
  Download,
  Share2,
  FileImage,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'
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
      <h1 className="flex items-center gap-2 whitespace-nowrap text-sm font-bold">
        <span className="bg-grad-accent flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[var(--shadow-accent)]">
          <Sparkles size={17} strokeWidth={2.5} />
        </span>
        <span className="text-grad-accent hidden sm:inline">Pic Collage Maker</span>
      </h1>

      <div className="flex items-center gap-1">
        <IconButton onClick={undo} disabled={!canUndo} label={t('header.undo')}>
          <Undo2 size={18} />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo} label={t('header.redo')}>
          <Redo2 size={18} />
        </IconButton>

        <span className="mx-0.5 h-6 w-px bg-border" />

        <IconButton onClick={toggleTheme} label={t('header.theme')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
          <Trash2 size={18} />
        </IconButton>

        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="bg-grad-accent flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95"
          >
            <Download size={16} strokeWidth={2.5} />
            {t('header.export')}
          </button>
          {/* Mobile refresh button – clears cached Service Worker and reloads */}
          <button
            onClick={async () => {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
              }
              // Force a hard reload, bypassing the Service Worker cache
              window.location.reload();
            }}
            className="ml-2 rounded bg-grad-accent px-3 py-1.5 text-sm text-white hover:bg-grad-accent/80"
          >
            {t('header.refresh')}
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl">
                {canShareImage() && (
                  <MenuItem onClick={() => pick('share')} icon={<Share2 size={16} />}>
                    {t('export.share')}
                  </MenuItem>
                )}
                <MenuItem onClick={() => pick('png')} icon={<ImageIcon size={16} />}>
                  {t('export.png')}
                </MenuItem>
                <MenuItem onClick={() => pick('jpg')} icon={<FileImage size={16} />}>
                  {t('export.jpg')}
                </MenuItem>
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
  icon,
}: {
  onClick: () => void
  children: string
  icon?: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text/90 transition hover:bg-surface-3"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </button>
  )
}
