import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  Undo2, Redo2, Sun, Moon, Trash2, Download,
  Share2, FileImage, Image as ImageIcon, Sparkles,
  RefreshCcw, Menu, FolderOpen, Save, Upload,
  ChevronDown,
} from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useProjects } from '../store/projectsStore'
import { canShareImage } from '../lib/exportImage'
import { clearPersisted } from '../lib/persistence'
import { useT } from '../i18n/useLang'
import { useTheme } from '../i18n/useTheme'
import { useLang } from '../i18n/useLang'
import { LangSwitcher } from './LangSwitcher'
import { IconButton } from './ui'
import ProjectManager from './ProjectManager'
import { ActionSheet, ActionItem, ActionDivider, ActionCancel } from './ActionSheet'
import { AnimatePresence, motion } from 'framer-motion'
import { useToasts } from './ToastContainer'

export type ExportKind = 'png' | 'jpg' | 'share'

export function HeaderBar({ onExport }: { onExport: (kind: ExportKind) => void }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [projectManagerOpen, setProjectManagerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const t = useT()
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)
  const clearAll = useEditor((s) => s.clearAll)
  const hasElements = useEditor((s) => s.elements.length > 0)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const canUndo = useEditor((s) => s.past.length > 0)
  const canRedo = useEditor((s) => s.future.length > 0)
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggleTheme)
  const activeProjectId = useProjects((s) => s.activeProjectId)
  const saveActiveProject = useProjects((s) => s.saveActiveProject)
  const toast = useToasts()

  // Auto-hide header on scroll (desktop)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSaveAsFile = async () => {
    const { packProject } = await import('../lib/projectFile')
    const doc = {
      boardWidth: useEditor.getState().boardWidth,
      boardHeight: useEditor.getState().boardHeight,
      background: useEditor.getState().background,
      mode: useEditor.getState().mode,
      gridId: useEditor.getState().gridId,
      gridGap: useEditor.getState().gridGap,
      gridRadius: useEditor.getState().gridRadius,
      frame: useEditor.getState().frame,
      elements: useEditor.getState().elements,
    }
    const blob = await packProject(activeProjectId ? 'Project' : 'Collage', doc)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `collage-${Date.now()}.piccollage`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Project saved as file')
  }

  const handleOpenFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { unpackProject } = await import('../lib/projectFile')
    const { doc } = await unpackProject(file)
    useEditor.getState().loadDocument(doc)
    e.target.value = ''
    toast.success('Project opened')
  }

  const handleExport = async (kind: ExportKind) => {
    setExportOpen(false)
    onExport(kind)
  }

  const handleRefresh = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    window.location.reload()
  }

  const handleNew = () => {
    if (hasElements && window.confirm(t('header.clearConfirm'))) {
      clearAll()
      void clearPersisted()
      toast.info('Canvas cleared')
    }
  }

  const handleSave = async () => {
    if (activeProjectId) {
      await saveActiveProject()
      toast.success(t('project.saved'))
    } else {
      setProjectManagerOpen(true)
    }
  }

  const accentBtn =
    'bg-grad-accent flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95 cursor-pointer'

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: scrolled ? -60 : 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="flex items-center justify-between gap-2 border-b border-border/60 bg-surface/80 px-3 py-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl select-none z-50"
      >
        {/* Brand */}
        <h1 className="flex items-center gap-2 shrink-0 min-w-0">
          <span className="bg-grad-accent flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-[var(--shadow-accent)] shrink-0">
            <Sparkles size={17} strokeWidth={2.5} />
          </span>
          <span className="text-grad-accent hidden sm:inline text-sm font-bold truncate">
            Pic Collage
          </span>
        </h1>

        {/* Desktop Actions */}
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
          <span className="mx-0.5 h-6 w-px bg-border" />
          <IconButton onClick={() => setProjectManagerOpen(true)} label={t('header.projects')}>
            <FolderOpen size={18} />
          </IconButton>
          <IconButton onClick={handleSave} label={t('project.save')}>
            <Save size={18} />
          </IconButton>
          <IconButton onClick={handleNew} disabled={!hasElements} label={t('header.new')}>
            <Trash2 size={18} />
          </IconButton>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Export dropdown (desktop) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className={accentBtn}
              aria-expanded={exportOpen}
              aria-haspopup="menu"
            >
              <Download size={16} strokeWidth={2.5} />
              <span>{t('header.export')}</span>
              <ChevronDown size={14} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {exportOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl"
                    role="menu"
                  >
                    {canShareImage() && (
                      <MenuItem onClick={() => handleExport('share')} icon={<Share2 size={16} />}>
                        {t('export.share')}
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => handleExport('png')} icon={<ImageIcon size={16} />}>
                      {t('export.png')}
                    </MenuItem>
                    <MenuItem onClick={() => handleExport('jpg')} icon={<FileImage size={16} />}>
                      {t('export.jpg')}
                    </MenuItem>
                    <div className="mx-3 my-1 h-px bg-border" />
                    <MenuItem onClick={handleSaveAsFile} icon={<Upload size={16} />}>
                      Save as .piccollage
                    </MenuItem>
                    <label className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-sm text-text/90 transition hover:bg-surface-3">
                      <Upload size={16} className="text-muted" />
                      <span>Open .piccollage</span>
                      <input
                        type="file"
                        accept=".piccollage,application/json"
                        onChange={handleOpenFile}
                        className="sr-only"
                      />
                    </label>
                  </motion.div>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-text/80 transition hover:bg-surface-3 active:scale-95 sm:hidden"
            aria-label={t('menu.more')}
            title={t('menu.more')}
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>

          {/* Mobile export (compact) */}
          <button
            onClick={() => handleExport('png')}
            className={`${accentBtn} sm:hidden`}
            aria-label={t('header.export')}
          >
            <Download size={16} strokeWidth={2.5} />
          </button>

          {/* Refresh */}
          <button onClick={handleRefresh} className={accentBtn} aria-label={t('header.refresh')} title={t('header.refresh')}>
            <RefreshCcw size={14} className="sm:hidden" strokeWidth={2.5} />
            <RefreshCcw size={16} className="hidden sm:block" strokeWidth={2.5} />
            <span className="hidden sm:inline">{t('header.refresh')}</span>
          </button>
        </div>
      </motion.header>

      {/* Mobile Action Sheet */}
      <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('menu.more')}>
        <ActionItem
          onClick={() => { setSheetOpen(false); undo() }}
          icon={<Undo2 size={18} />}
          label={t('header.undo')}
          disabled={!canUndo}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); redo() }}
          icon={<Redo2 size={18} />}
          label={t('header.redo')}
          disabled={!canRedo}
        />
        <ActionDivider />
        <ActionItem
          onClick={() => { setSheetOpen(false); toggleTheme() }}
          icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          label={t('header.theme')}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); setLang(lang === 'de' ? 'en' : 'de') }}
          icon={<span className="text-lg">{lang === 'de' ? '🇬🇧' : '🇩🇪'}</span>}
          label={lang === 'de' ? 'English' : 'Deutsch'}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); setProjectManagerOpen(true) }}
          icon={<FolderOpen size={18} />}
          label={t('header.projects')}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleSave() }}
          icon={<Save size={18} />}
          label={t('project.save')}
        />
        <ActionDivider />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleNew() }}
          icon={<Trash2 size={18} />}
          label={t('header.new')}
          disabled={!hasElements}
          danger
        />
        <ActionDivider />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleExport('share') }}
          icon={<Share2 size={18} />}
          label={t('export.share')}
          disabled={!canShareImage()}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleExport('png') }}
          icon={<ImageIcon size={18} />}
          label={t('export.png')}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleExport('jpg') }}
          icon={<FileImage size={18} />}
          label={t('export.jpg')}
        />
        <ActionItem
          onClick={() => { setSheetOpen(false); handleSaveAsFile() }}
          icon={<Upload size={18} />}
          label="Save as .piccollage"
        />
        <label className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-text transition hover:bg-surface-3 active:scale-[0.98]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-muted">
            <Upload size={18} />
          </span>
          <span>Open .piccollage</span>
          <input
            type="file"
            accept=".piccollage,application/json"
            onChange={(e) => { setSheetOpen(false); handleOpenFile(e) }}
            className="sr-only"
          />
        </label>

        <ActionCancel onClick={() => setSheetOpen(false)} label={t('menu.cancel')} />
      </ActionSheet>

      <ProjectManager open={projectManagerOpen} onClose={() => setProjectManagerOpen(false)} />
    </>
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
      role="menuitem"
      className={`flex min-h-[44px] w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text/90 transition hover:bg-surface-3 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {icon && <span className="text-muted">{icon}</span>}
      {children}
    </button>
  )
}
