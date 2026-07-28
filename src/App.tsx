import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import type { EditorHandle } from './components/EditorCanvas'

/*
 * The canvas is deferred, not because it is optional but because it is
 * expensive: react-konva pulls in Konva, the single largest chunk, and the
 * first thing a user sees is the layout gallery — plain DOM that needs none of
 * it. Loading it eagerly put ~2s of script evaluation on the critical path and
 * was the main contributor to Lighthouse's 1.1s total blocking time.
 */
const EditorCanvas = lazy(() =>
  import('./components/EditorCanvas').then((m) => ({ default: m.EditorCanvas })),
)
// Also react-konva, and only on screen while cropping.
const CropOverlay = lazy(() =>
  import('./components/CropOverlay').then((m) => ({ default: m.CropOverlay })),
)
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
import { UpdateBanner } from './components/UpdateBanner'
import { ZoomControls } from './components/ZoomControls'
import { StatusBar } from './components/StatusBar'
import { useEditor } from './store/editorStore'
import { useT } from './i18n/useLang'
import { useProjects, defaultProjectName } from './store/projectsStore'
import { useWorkspace } from './store/workspaceStore'
import {
  downloadDataURL,
  shareDataURL,
  type ExportFormat,
} from './lib/exportImage'
import { exportSVG, downloadSVG } from './lib/exportSVG'
import { fireConfetti } from './lib/confetti'
import { track } from './lib/analytics'
import { InstallSheet } from './components/InstallSheet'
import { useInstall } from './lib/pwaInstall'
import { ToastContainer, useToasts } from './components/ToastContainer'
import { useDefaultShortcuts } from './hooks/useKeyboard'
import { OnboardingOverlay } from './components/Onboarding'
import { restoreCustomFonts } from './lib/fonts'
import { extractFirstExif, injectExifIntoJpeg } from './lib/exifHelpers'
import { loadDoc, saveDoc, type StoredDoc } from './lib/persistence'
import { rehydratePhotos, stripPhotoUrls } from './lib/photoRehydrate'

const INSTALL_NUDGE_KEY = 'pic-collage-install-nudged'

/** True at most once ever, and never when installing is impossible or done. */
function shouldNudgeInstall(): boolean {
  const { standalone, platform } = useInstall.getState()
  if (standalone || platform === 'unsupported') return false
  try {
    if (localStorage.getItem(INSTALL_NUDGE_KEY)) return false
    localStorage.setItem(INSTALL_NUDGE_KEY, '1')
  } catch {
    return false
  }
  return true
}

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
    elements: stripPhotoUrls(s.elements),
  }
}

export default function App() {
  const editorRef = useRef<EditorHandle>(null)
  const [installOpen, setInstallOpen] = useState(false)
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
  const toast = useToasts()

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
        const elements = await rehydratePhotos(stored.elements)
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

  /**
   * Persist the current work before an action that hands the user off to
   * another app. The existing debounced autosave only runs once a project
   * exists, so with no active project there is nothing to save into — create
   * one, silently, rather than leaving the work unprotected.
   */
  const ensureProjectSaved = async () => {
    const projects = useProjects.getState()
    try {
      if (projects.activeProjectId) await projects.saveActiveProject()
      else await projects.createProject(defaultProjectName())
    } catch {
      // Saving is a courtesy here; never let it block the share.
    }
  }

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
      track('export-pdf')
      const { exportPDF, downloadPDF } = await import('./lib/exportPDF')
      const s = useEditor.getState()
      const url = await editorRef.current?.exportImage('png')
      if (url) {
        const pdf = await exportPDF([{ dataUrl: url, width: s.boardWidth, height: s.boardHeight }])
        downloadPDF(pdf, `collage-${Date.now()}.pdf`)
        fireConfetti()
        maybeNudgeInstall()
      }
      return
    }
    // Share as JPEG: it is a fraction of the size and Android share targets
    // accept it far more reliably — several reject a large PNG outright.
    const format: ExportFormat = kind === 'jpg' || kind === 'share' ? 'jpg' : 'png'
    // Sharing takes the user out of the app, so get their work on disk first.
    if (kind === 'share') await ensureProjectSaved()

    let url = await editorRef.current?.exportImage(format)
    if (url) {
      track(kind === 'share' ? 'export-share' : `export-${format}`)
      // Preserve EXIF for JPEG exports
      if (format === 'jpg') {
        const exif = await extractFirstExif(useEditor.getState().elements)
        if (exif) {
          url = injectExifIntoJpeg(url, exif)
        }
      }
      if (kind === 'share') {
        const outcome = await shareDataURL(url, format, t('share.title'))
        // Cancelling is a decision, not a failure: no file, no confetti, no
        // toast. Downloading anyway is what put an unwanted "open in Preview"
        // sheet in front of testers who had changed their mind.
        if (outcome === 'cancelled') {
          track('share-cancelled')
          return
        }
        if (outcome === 'unsupported') {
          downloadDataURL(url, format)
        } else {
          // `navigator.share()` resolving only means the target *accepted* the
          // intent. Facebook accepts it and then opens its composer without the
          // file, so a resolved share is no guarantee the picture went
          // anywhere. Leave the user a one-tap way to keep it.
          const saved = url
          toast.action(t('share.maybeFailed'), {
            label: t('share.saveInstead'),
            onClick: () => downloadDataURL(saved, format),
          })
        }
      } else {
        downloadDataURL(url, format)
      }
      // Celebrate the outcome, not the button press.
      fireConfetti()
      maybeNudgeInstall()
    }
  }

  // Let the confetti and the download land before asking for anything.
  const maybeNudgeInstall = () => {
    if (!shouldNudgeInstall()) return
    setTimeout(() => {
      track('install-shown')
      setInstallOpen(true)
    }, 1400)
  }

  const handleExportSVG = () => {
    track('export-svg')
    select(null)
    const s = useEditor.getState()
    const svg = exportSVG(s.elements, s.boardWidth, s.boardHeight, s.background)
    downloadSVG(svg)
  }

  return (
    <MotionProvider>
      <div className="flex h-full flex-col bg-surface text-text">
        <HeaderBar
          onExport={handleExport}
          onExportSVG={handleExportSVG}
          onInstall={() => {
            track('install-shown')
            setInstallOpen(true)
          }}
        />
        {isDesktop ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <ToolRail panels={panels} />
              <div className="relative min-h-0 flex-1 overflow-hidden bg-bg">
                {/* Subtle dot grid on empty canvas */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <Suspense fallback={null}>
                  <EditorCanvas ref={editorRef} />
                </Suspense>
                <SelectionBar />
                <EmptyState />
                <Suspense fallback={null}><CropOverlay /></Suspense>
                <ZoomControls />
              </div>
              <SidePanel panels={panels} width={sidePanelWidth} />
            </div>
            <StatusBar />
          </div>
        ) : (
          <>
            {/* Mobile: canvas area with insets for header overlay + bottom controls */}
            <div className="relative min-h-0 flex-1 overflow-hidden bg-bg">
              {/* Subtle dot grid on empty canvas */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(circle, var(--text) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              {/* The sheet overlays the stage at 46% of this box (BottomSheet's
                  collapsed snap point) with no scrim, so tell the canvas to fit
                  the board above it. Dragging it up to 86% is left alone — that
                  is a deliberate "show me more panel" gesture. */}
              <Suspense fallback={null}>
                <EditorCanvas ref={editorRef} bottomInset={panels.current ? 0.46 : 0} />
              </Suspense>
              <SelectionBar />
              <EmptyState />
              <MobileSheet panels={panels} />
              <Suspense fallback={null}><CropOverlay /></Suspense>
              <ZoomControls />
            </div>
            <MobileTabBar panels={panels} />
          </>
        )}
        <InstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
        <UpdateBanner />
        <ToastContainer />
        <OnboardingOverlay />
      </div>
    </MotionProvider>
  )
}
