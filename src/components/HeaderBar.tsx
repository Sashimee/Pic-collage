import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Undo2, Redo2, Sun, Moon, Trash2, Download,
  Share2, FileImage, Image as ImageIcon, Sparkles,
  RefreshCcw, MoreHorizontal,
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
  const [moreOpen, setMoreOpen] = useState(false)
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

  const handleRefresh = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    window.location.reload()
  }

  const accentBtn =
    'bg-grad-accent flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95 cursor-pointer'

  return (
    <header className="flex items-center justify-between gap-1.5 sm:gap-2 border-b border-border bg-surface px-2 sm:px-3 py-2 pt-[calc(env(safe-area-inset-top)+0.55rem)]">
      <h1 className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="bg-grad-accent flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[var(--shadow-accent)]">
          <Sparkles size={17} strokeWidth={2.5} />
        </span>
        <span className="text-grad-accent hidden sm:inline text-sm font-bold">Pic Collage Maker</span>
      </h1>

      <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-1">
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
        </div>

        {/* Mobile More */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text/80 hover:bg-surface-3 active:scale-95"
          >
            <MoreHorizontal size={20} />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
              <div className="absolute right-0 z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl">
                <MenuItem onClick={undo} disabled={!canUndo}>
                  <Undo2 size={16} /> {t('header.undo')}
                </MenuItem>
                <MenuItem onClick={redo} disabled={!canRedo}>
                  <Redo2 size={16} /> {t('header.redo')}
                </MenuItem>
                <div className="mx-3 my-1 h-px bg-border" />
                <MenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {t('header.theme')}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (hasElements && window.confirm(t('header.clearConfirm'))) {
                      clearAll()
                      void clearPersisted()
                    }
                  }}
                  disabled={!hasElements}
                >
                  <Trash2 size={16} /> {t('header.new')}
                </MenuItem>
              </div>
            </>
          )}
        </div>

        {/* Export */}
        <div className="relative shrink-0">
          <button onClick={() => setMenu((m) => !m)} className={accentBtn}>
            <Download size={14} className="sm:hidden" strokeWidth={2.5} />
            <Download size={16} className="hidden sm:block" strokeWidth={2.5} />
            <span className="hidden sm:inline">{t('header.export')}</span>
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

        {/* Refresh */}
        <button onClick={handleRefresh} className={accentBtn}>
          <RefreshCcw size={14} className="sm:hidden" strokeWidth={2.5} />
          <RefreshCcw size={16} className="hidden sm:block" strokeWidth={2.5} />
          <span className="hidden sm:inline">{t('header.refresh')}</span>
        </button>
      </div>
    </header>
  )
}

function MenuItem({
  onClick,
  children,
  icon,
  disabled,
}: {
  onClick?: () => void
  children: ReactNode
  icon?: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[44px] w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text/90 transition hover:bg-surface-3 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {icon && <span className="text-muted">{icon}</span>}
      {children}
    </button>
  )
}
