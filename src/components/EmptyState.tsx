import { ImagePlus, Camera } from 'lucide-react'
import { useState } from 'react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import { importFiles } from '../lib/importFiles'
import { getGridById } from '../lib/grids'
import { LayoutGallery } from './LayoutGallery'
import { PhotoAssignmentSheet } from './PhotoAssignmentSheet'
import { m, AnimatePresence } from './motion'

const GALLERY_ID = 'empty-gallery-input'
const CAMERA_ID = 'empty-camera-input'

export function EmptyState() {
  const t = useT()
  const isEmpty = useEditor((s) => s.elements.length === 0)
  const mode = useEditor((s) => s.mode)
  const addPhoto = useEditor((s) => s.addPhoto)
  const setMode = useEditor((s) => s.setMode)
  const applyLayout = useEditor((s) => s.applyLayout)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [showAssignment, setShowAssignment] = useState(false)

  const selectedLayout = selectedLayoutId ? getGridById(selectedLayoutId) : null

  // Don't show gallery overlay when in custom-layout mode — let user draw on canvas
  const showGallery = isEmpty && mode !== 'custom-layout'

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        await importFiles(e.target.files, addPhoto)
      } catch {
        window.alert(t('error.loadImage'))
      }
    }
    e.currentTarget.value = ''
  }

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        await importFiles(e.target.files, addPhoto)
      } catch {
        window.alert(t('error.loadCamera'))
      }
    }
    e.currentTarget.value = ''
  }

  const handleSelectLayout = (layoutId: string) => {
    applyLayout(layoutId)
    setSelectedLayoutId(layoutId)
    setShowAssignment(true)
  }

  const handleCustomLayout = () => {
    setSelectedLayoutId(null)
    setShowAssignment(false)
    setMode('custom-layout')
  }

  const handleSkip = () => {
    setMode('free')
  }

  const handleAssign = async (files: File[]) => {
    if (files.length > 0) {
      const dataTransfer = new DataTransfer()
      files.forEach((f) => dataTransfer.items.add(f))
      const input = document.createElement('input')
      input.type = 'file'
      input.files = dataTransfer.files
      await importFiles(input.files, addPhoto).catch(() => {
        window.alert(t('error.loadImages'))
      })
    }
    // Sheet stays open so user can fill remaining slots
  }

  const handleDoneAssignment = () => {
    setShowAssignment(false)
    // Unmount after exit animation completes (~300ms for spring)
    setTimeout(() => setSelectedLayoutId(null), 350)
  }

  const handleSkipAssignment = () => {
    setShowAssignment(false)
    setTimeout(() => setSelectedLayoutId(null), 350)
  }

  return (
    <>
      {/* Gallery overlay — only when gallery should be visible */}
      <AnimatePresence>
        {showGallery && (
          <m.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <input
              id={GALLERY_ID}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleGalleryChange}
            />
            <input
              id={CAMERA_ID}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleCameraChange}
            />

            <m.div
              className="pointer-events-auto flex w-full max-w-lg flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            >
              {/* Layout Gallery */}
              <LayoutGallery
                onSelectLayout={handleSelectLayout}
                onCustomLayout={handleCustomLayout}
                onSkip={handleSkip}
              />

              {/* Secondary: direct photo add buttons */}
              <div className="flex justify-center gap-3">
                <label
                  htmlFor={GALLERY_ID}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-text transition hover:bg-surface-3 active:scale-95"
                >
                  <ImagePlus size={17} strokeWidth={2.5} />
                  {t('photos.add')}
                </label>
                <label
                  htmlFor={CAMERA_ID}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-text transition hover:bg-surface-3 active:scale-95"
                >
                  <Camera size={17} strokeWidth={2.5} />
                  {t('photos.camera')}
                </label>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Photo Assignment Sheet — sibling to gallery, NOT nested inside overlay */}
      <AnimatePresence>
        {selectedLayout && (
          <PhotoAssignmentSheet
            layout={selectedLayout}
            open={showAssignment}
            onClose={handleSkipAssignment}
            onAssign={handleAssign}
            onSkip={handleSkipAssignment}
            onDone={handleDoneAssignment}
          />
        )}
      </AnimatePresence>
    </>
  )
}
