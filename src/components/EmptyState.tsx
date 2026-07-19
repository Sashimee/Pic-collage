import { ImagePlus, Camera, Sparkles } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import { importFiles } from '../lib/importFiles'
import { getTemplateLayout, TEMPLATES, type Template } from '../lib/templates'
import { LayoutPreview } from './LayoutPreview'
import { m, AnimatePresence } from './motion'

const GALLERY_ID = 'empty-gallery-input'
const CAMERA_ID = 'empty-camera-input'

export function EmptyState() {
  const t = useT()
  const isEmpty = useEditor((s) => s.elements.length === 0)
  const addPhoto = useEditor((s) => s.addPhoto)
  const setGrid = useEditor((s) => s.setGrid)
  const setMode = useEditor((s) => s.setMode)
  const setGridGap = useEditor((s) => s.setGridGap)
  const setGridRadius = useEditor((s) => s.setGridRadius)
  const setFrame = useEditor((s) => s.setFrame)
  const setBoardSize = useEditor((s) => s.setBoardSize)

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importFiles(e.target.files, addPhoto)
    }
    e.currentTarget.value = ''
  }

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importFiles(e.target.files, addPhoto)
    }
    e.currentTarget.value = ''
  }

  const startTemplate = (tpl: Template) => {
    if (tpl.boardWidth && tpl.boardHeight) setBoardSize(tpl.boardWidth, tpl.boardHeight)
    setMode('grid')
    setGrid(tpl.gridId)
    if (tpl.gridGap !== undefined) setGridGap(tpl.gridGap)
    if (tpl.gridRadius !== undefined) setGridRadius(tpl.gridRadius)
    if (tpl.frame) setFrame(tpl.frame)
  }

  return (
    <AnimatePresence>
      {isEmpty && (
        <m.div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
        >
          {/* Hidden file inputs — sr-only so label activation works on mobile */}
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
            className="pointer-events-auto w-full max-w-md rounded-3xl border border-border bg-surface/80 p-7 text-center shadow-[var(--shadow-card)] backdrop-blur"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="bg-grad-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-accent)]">
              <Sparkles size={30} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-text">{t('empty.title')}</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
              {t('empty.subtitle')}
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <label
                htmlFor={GALLERY_ID}
                className="bg-grad-accent flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <ImagePlus size={17} strokeWidth={2.5} />
                {t('photos.add')}
              </label>
              <label
                htmlFor={CAMERA_ID}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-3 active:scale-95 cursor-pointer"
              >
                <Camera size={17} strokeWidth={2.5} />
                {t('photos.camera')}
              </label>
            </div>

            <div className="mt-6 text-left">
              <p className="mb-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                {t('empty.startLayout')}
              </p>
              <div className="scroll-x flex gap-3 overflow-x-auto px-1 pb-2">
                {TEMPLATES.map((tpl) => {
                  const layout = getTemplateLayout(tpl)
                  if (!layout) return null
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => startTemplate(tpl)}
                      aria-label={t(tpl.titleKey)}
                      className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl p-1 transition active:scale-95"
                    >
                      <LayoutPreview layout={layout} width={64} height={80} active={false} />
                      <span className="max-w-[64px] text-[0.65rem] font-medium leading-tight text-muted">
                        {t(tpl.titleKey)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
