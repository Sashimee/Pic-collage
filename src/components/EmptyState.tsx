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
  const addPhoto = useEditor((s) => s.addPhoto)
  const setMode = useEditor((s) => s.setMode)
  const applyLayout = useEditor((s) => s.applyLayout)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
  const [showAssignment, setShowAssignment] = useState(false)

  const selectedLayout = selectedLayoutId ? getGridById(selectedLayoutId) : null

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        await importFiles(e.target.files, addPhoto)
      } catch {
        window.alert('Failed to load image. Please try a different file.')
      }
    }
    e.currentTarget.value = ''
  }

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        await importFiles(e.target.files, addPhoto)
      } catch {
        window.alert('Failed to load camera photo. Please try again.')
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
        window.alert('Failed to load images.')
      })
    }
    setShowAssignment(false)
    setSelectedLayoutId(null)
  }

  const handleSkipAssignment = () => {
    setShowAssignment(false)
    setSelectedLayoutId(null)
  }

  // Not empty — don't show anything
  if (!isEmpty) return null

  return (
    <AnimatePresence>
      {isEmpty && (
        <m.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface/80 p-4 backdrop-blur-sm"
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
            className="pointer-events-auto flex w-full max-w-lg flex-col gap-4"
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

          {/* Photo Assignment Sheet */}
          {selectedLayout && (
            <PhotoAssignmentSheet
              layout={selectedLayout}
              open={showAssignment}
              onClose={handleSkipAssignment}
              onAssign={handleAssign}
              onSkip={handleSkipAssignment}
            />
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
