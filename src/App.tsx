import { useEffect, useRef, useState } from 'react'
import { EditorCanvas, type EditorHandle } from './components/EditorCanvas'
import { HeaderBar, type ExportKind } from './components/HeaderBar'
import { SelectionBar } from './components/SelectionBar'
import { MobileSheet, MobileTabBar, ToolRail, SidePanel } from './components/Docks'
import { EmptyState } from './components/EmptyState'
import { usePanels } from './components/panels.config'
import { MotionProvider } from './components/motion'
import { useIsDesktop } from './hooks/useMediaQuery'
import { useVersionCheck } from './hooks/useVersionCheck'
import { useMemoryPressure } from './hooks/useMemoryPressure'
import { useShortcuts } from './hooks/useShortcuts'
import { CropOverlay } from './components/CropOverlay'
import { UpdateBanner } from './components/UpdateBanner'
import { ZoomControls } from './components/ZoomControls'
import { StatusBar } from './components/StatusBar'
import { useEditor } from './store/editorStore'
import { useT } from './i18n/useLang'
import { useProjects } from './store/projectsStore'
import { useWorkspace } from './store/workspaceStore'
import type { CanvasElement } from './types'
import {
  downloadDataURL,
  shareDataURL,
  type ExportFormat,
} from './lib/exportImage'
import { exportSVG, downloadSVG } from './lib/exportSVG'
import { fireConfetti } from './lib/confetti'
import { ToastContainer } from './components/ToastContainer'
import { useDefaultShortcuts } from './hooks/useKeyboard'
import { OnboardingOverlay } from './components/Onboarding'
import { restoreCustomFonts } from './lib/fonts'
import { extractFirstExif, injectExifIntoJpeg } from './lib/exifHelpers'
import {
  getPhoto,
  loadDoc,
  saveDoc,
  type StoredDoc,
} from './lib/persistence'

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

// Build the persistable snapshot: photo blobs live in IndexedDB by photoId, so
// the JSON keeps only the id (object URLs are transient and must not be saved).
function toStoredDoc(): StoredDoc {
  const s = useEditor.getState()
  return {
    boardWidth: s.boardWidth,
    boardHeight: s.boardHeight,
    background: s.background,
    mode: s.mode,
    gridId: s.gridId,
    gridGap: s.gridGap,
    gridRadius: s.gridRadius,
    frame: s.frame,
    watermark: s.watermark,
    print: s.print,
    elements: s.elements.map((el) =>
      el.type === 'photo'
        ? { ...el, src: '', previewSrc: undefined, originalSrc: undefined, thumbSrc: undefined }
        : el,
    ),
  }
}

export default function App() {
  const editorRef = useRef<EditorHandle>(null)
  const select = useEditor((s) => s.select)
  const loadDocument = useEditor((s) => s.loadDocument)
  const [hydrated, setHydrated] = useState(false)
  const isDesktop = useIsDesktop()
  // Desktop keeps the docked side panel populated; mobile starts with the
  // sheet closed so the first-run hero isn't covered.
  const activeWorkspaceTab = useWorkspace((s) => s.activeTab)
  const panelSizes = useWorkspace((s) => s.panelSizes)
  const isDesktopInitial = isDesktop ? (activeWorkspaceTab ?? 'photos') : null
  const panels = usePanels(isDesktopInitial)
  const sidePanelWidth = panelSizes['side'] ?? 336
  const t = useT()

  useVersionCheck()
  useMemoryPressure()
  useDefaultShortcuts()

  // Restore custom fonts on startup
  useEffect(() => {
    restoreCustomFonts().catch(() => { /* ignore font errors */ })
  }, [])

  // Restore persisted work on startup: rebuild object URLs from stored blobs
  // (one URL per photoId, so duplicates keep sharing a src). Photos whose blob
  // is missing are dropped.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await loadDoc()
      if (stored && !cancelled && stored.elements.length) {
        const elements: CanvasElement[] = []
        for (const el of stored.elements) {
          if (el.type === 'photo') {
            if (!el.photoId) continue
            const [origBlob, prevBlob, thumbBlob] = await Promise.all([
              getPhoto(`${el.photoId}:orig`).catch(() => undefined),
              getPhoto(`${el.photoId}:prev`).catch(() => undefined),
              getPhoto(`${el.photoId}:thumb`).catch(() => undefined),
            ])
            if (!prevBlob) continue
            const originalSrc = origBlob ? URL.createObjectURL(origBlob) : undefined
            const previewSrc = URL.createObjectURL(prevBlob)
            const thumbSrc = thumbBlob ? URL.createObjectURL(thumbBlob) : undefined
            elements.push({
              ...el,
              src: previewSrc,
              previewSrc,
              originalSrc,
              thumbSrc,
            })
          } else {
            elements.push(el)
          }
        }
        if (!cancelled) loadDocument({ ...stored, elements })
      }
      if (!cancelled) setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [loadDocument])

  // Debounced autosave once the initial restore has run.
  useEffect(() => {
    if (!hydrated) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useEditor.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(() => void saveDoc(toStoredDoc()), 500)
    })
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [hydrated])

  const activeProjectId = useProjects((s) => s.activeProjectId)
  const saveActiveProject = useProjects((s) => s.saveActiveProject)
  const [_projectManagerOpen, setProjectManagerOpen] = useState(false)

  const handleSave = async () => {
    if (activeProjectId) {
      await saveActiveProject()
      window.alert(t('project.saved'))
    } else {
      setProjectManagerOpen(true)
    }
  }

  useShortcuts({
    onExport: () => handleExport('png'),
    onSave: handleSave,
    onOpenProject: () => setProjectManagerOpen(true),
  })

  // Release any leftover object URLs when the page is torn down.
  useEffect(() => {
    const cleanup = () => {
      for (const el of useEditor.getState().elements) {
        if (el.type === 'photo') {
          if (el.src?.startsWith('blob:')) URL.revokeObjectURL(el.src)
          if (el.previewSrc?.startsWith('blob:')) URL.revokeObjectURL(el.previewSrc)
          if (el.originalSrc?.startsWith('blob:')) URL.revokeObjectURL(el.originalSrc)
          if (el.thumbSrc?.startsWith('blob:')) URL.revokeObjectURL(el.thumbSrc)
        }
      }
    }
    window.addEventListener('beforeunload', cleanup)
    return () => window.removeEventListener('beforeunload', cleanup)
  }, [])

  const handleExport = async (kind: ExportKind) => {
    // Drop the selection so transform handles / grid highlight aren't captured,
    // then wait a frame for the canvas to redraw before snapshotting.
    select(null)
    await nextFrame()
    if (kind === 'svg') {
      // SVG export handled separately via onExportSVG
      return
    }
    if (kind === 'batch') {
      // Handled by HeaderBar's handleBatchExport
      return
    }
    if (kind === 'pdf') {
      const { exportPDF, downloadPDF } = await import('./lib/exportPDF')
      const s = useEditor.getState()
      const url = editorRef.current?.exportImage('png')
      if (url) {
        const pdf = await exportPDF([{ dataUrl: url, width: s.boardWidth, height: s.boardHeight }])
        downloadPDF(pdf, `collage-${Date.now()}.pdf`)
        fireConfetti()
      }
      return
    }
    if (kind === 'webm') {
      const { exportWebM } = await import('./lib/exportAnimation')
      const s = useEditor.getState()
      const url = editorRef.current?.exportImage('png')
      if (url) {
        // Create offscreen canvas for WebM recording
        const canvas = document.createElement('canvas')
        canvas.width = s.boardWidth
        canvas.height = s.boardHeight
        const ctx = canvas.getContext('2d')!
        const img = new Image()
        img.src = url
        await new Promise((resolve) => { img.onload = resolve })
        ctx.drawImage(img, 0, 0)
        const blob = await exportWebM(canvas, 30, 2)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `collage-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(a.href)
        fireConfetti()
      }
      return
    }
    const format: ExportFormat = kind === 'jpg' ? 'jpg' : 'png'
    let url = editorRef.current?.exportImage(format)
    if (url) {
      fireConfetti()
      // Preserve EXIF for JPEG exports
      if (format === 'jpg') {
        const exif = await extractFirstExif(useEditor.getState().elements)
        if (exif) {
          url = injectExifIntoJpeg(url, exif)
        }
      }
      if (kind === 'share') {
        const shared = await shareDataURL(url, format, t('share.title'))
        if (!shared) downloadDataURL(url, format)
      } else {
        downloadDataURL(url, format)
      }
    }
  }

  const handleExportSVG = () => {
    select(null)
    const s = useEditor.getState()
    const svg = exportSVG(s.elements, s.boardWidth, s.boardHeight, s.background)
    downloadSVG(svg)
  }

  return (
    <MotionProvider>
      <div className="flex h-full flex-col bg-surface text-text">
        <HeaderBar onExport={handleExport} onExportSVG={handleExportSVG} />
        {isDesktop ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <ToolRail panels={panels} />
              <div className="relative min-h-0 flex-1 bg-bg">
                {/* Subtle dot grid on empty canvas */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <EditorCanvas ref={editorRef} />
                <SelectionBar />
                <EmptyState />
                <CropOverlay />
                <ZoomControls />
              </div>
              <SidePanel panels={panels} width={sidePanelWidth} />
            </div>
            <StatusBar />
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1 bg-bg">
              {/* Subtle dot grid on empty canvas */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <EditorCanvas ref={editorRef} />
              <SelectionBar />
              <EmptyState />
              <MobileSheet panels={panels} />
              <CropOverlay />
              <ZoomControls />
            </div>
            <MobileTabBar panels={panels} />
          </>
        )}
        <UpdateBanner />
        <ToastContainer />
        <OnboardingOverlay />
      </div>
    </MotionProvider>
  )
}
