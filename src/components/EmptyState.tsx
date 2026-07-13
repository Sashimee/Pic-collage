import { useRef } from 'react'
import { ImagePlus, Camera, Sparkles } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { useT } from '../i18n/useLang'
import { importFiles } from '../lib/importFiles'
import { GRID_LAYOUTS } from '../lib/grids'
import { LayoutPreview } from './LayoutPreview'
import { m, AnimatePresence } from './motion'

// A few starter layouts surfaced on the first-run hero.
const STARTERS = ['2-v', '2-h', '3-col', '4-grid', '4-pinwheel'].flatMap((id) => {
  const l = GRID_LAYOUTS.find((g) => g.id === id)
  return l ? [l] : []
})

// Friendly first-run overlay shown while the board is empty. Dismisses itself
// (with an exit animation) as soon as the first element exists.
export function EmptyState() {
  const t = useT()
  const isEmpty = useEditor((s) => s.elements.length === 0)
  const addPhoto = useEditor((s) => s.addPhoto)
  const setGrid = useEditor((s) => s.setGrid)
  const setMode = useEditor((s) => s.setMode)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const startLayout = (id: string) => {
    setMode('grid')
    setGrid(id)
    galleryRef.current?.click()
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
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && importFiles(e.target.files, addPhoto)}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => e.target.files && importFiles(e.target.files, addPhoto)}
          />

          <m.div
            className="pointer-events-auto w-full max-w-sm rounded-3xl border border-border bg-surface/80 p-7 text-center shadow-[var(--shadow-card)] backdrop-blur"
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
              <button
                onClick={() => galleryRef.current?.click()}
                className="bg-grad-accent flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:brightness-110 active:scale-95"
              >
                <ImagePlus size={17} strokeWidth={2.5} />
                {t('photos.add')}
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-3 active:scale-95"
              >
                <Camera size={17} strokeWidth={2.5} />
                {t('photos.camera')}
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                {t('empty.startLayout')}
              </p>
              <div className="flex justify-center gap-2.5">
                {STARTERS.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => startLayout(layout.id)}
                    aria-label={layout.id}
                    className="rounded-lg ring-border transition hover:ring-2 hover:ring-accent active:scale-95"
                  >
                    <LayoutPreview layout={layout} width={44} height={55} active={false} />
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
