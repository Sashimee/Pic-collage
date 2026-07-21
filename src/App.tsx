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
import { useShortcuts } from './hooks/useShortcuts'
import { CropOverlay } from './components/CropOverlay'
import { UpdateBanner } from './components/UpdateBanner'
import { ZoomControls } from './components/ZoomControls'
import { StatusBar } from './components/StatusBar'
import { useEditor } from './store/editorStore'
import { useT } from './i18n/useLang'
import { useProjects } from './store/projectsStore'
import type { CanvasElement } from './types'
import {
  downloadDataURL,
  shareDataURL,
  type ExportFormat,
} from './lib/exportImage'
import { fireConfetti } from './lib/confetti'
import { ToastContainer } from './components/ToastContainer'
import { useDefaultShortcuts } from './hooks/useKeyboard'
import { OnboardingOverlay } from './components/Onboarding'
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
    elements: s.elements.map((el) =>
      el.type === 'photo' ? { ...el, src: '' } : el,
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
  const panels = usePanels(isDesktop ? 'photos' : null)
  const t = useT()

  useVersionCheck()
  useDefaultShortcuts()

  // Restore persisted work on startup: rebuild object URLs from stored blobs
  // (one URL per photoId, so duplicates keep sharing a src). Photos whose blob
  // is missing are dropped.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await loadDoc()
      if (stored && !cancelled && stored.elements.length) {
        const urlByPhoto = new Map<string, string>()
        const elements: CanvasElement[] = []
        for (const el of stored.elements) {
          if (el.type === 'photo') {
            if (!el.photoId) continue
            let url = urlByPhoto.get(el.photoId)
            if (!url) {
              const blob = await getPhoto(el.photoId)
              if (!blob) continue
              url = URL.createObjectURL(blob)
              urlByPhoto.set(el.photoId, url)
            }
            elements.push({ ...el, src: url })
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
        if (el.type === 'photo' && el.src.startsWith('blob:')) {
          URL.revokeObjectURL(el.src)
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
    const format: ExportFormat = kind === 'jpg' ? 'jpg' : 'png'
    const url = editorRef.current?.exportImage(format)
    if (url) {
      fireConfetti()
      if (kind === 'share') {
        const shared = await shareDataURL(url, format, t('share.title'))
        if (!shared) downloadDataURL(url, format)
      } else {
        downloadDataURL(url, format)
      }
    }
  }

  return (
    <MotionProvider>
      <div className="flex h-full flex-col bg-surface text-text">
        <HeaderBar onExport={handleExport} />
        {isDesktop ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              <ToolRail panels={panels} />
              <div className="relative min-h-0 flex-1 bg-bg">
                <EditorCanvas ref={editorRef} />
                <SelectionBar />
                <EmptyState />
                <CropOverlay />
                <ZoomControls />
              </div>
              <SidePanel panels={panels} />
            </div>
            <StatusBar />
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1 bg-bg">
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
