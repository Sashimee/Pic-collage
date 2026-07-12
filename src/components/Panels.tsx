import { useRef, useState } from 'react'
import { useEditor } from '../store/editorStore'
import { GRID_LAYOUTS } from '../lib/grids'
import { FILTER_PRESETS } from '../lib/filters'
import { PHOTO_SHAPES } from '../lib/shapes'
import { PATTERN_GLYPH, PATTERN_IDS } from '../lib/patterns'
import { loadPhotoMeta } from '../lib/importPhotos'
import { putPhoto } from '../lib/persistence'
import type { FrameStyle, PhotoElement, TextElement } from '../types'
import { Chip, ColorField, PrimaryButton, Slider } from './ui'
import { useT } from '../i18n/useLang'
import { EMOJI_CATEGORIES } from '../lib/emojis'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

async function importFiles(
  files: FileList,
  add: (src: string, w: number, h: number, photoId?: string) => void,
) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    try {
      const meta = await loadPhotoMeta(file)
      // Stash the source blob so the collage survives a reload.
      const photoId = uid()
      void putPhoto(photoId, meta.blob)
      add(meta.src, meta.width, meta.height, photoId)
    } catch {
      /* skip undecodable files */
    }
  }
}

// ---- Photos --------------------------------------------------------------

export function PhotosPanel() {
  const t = useT()
  const addPhoto = useEditor((s) => s.addPhoto)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex gap-3">
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
      <PrimaryButton onClick={() => galleryRef.current?.click()}>
        {t('photos.add')}
      </PrimaryButton>
      <PrimaryButton onClick={() => cameraRef.current?.click()}>
        {t('photos.camera')}
      </PrimaryButton>
    </div>
  )
}

// ---- Layout (canvas size + grids) ---------------------------------------

const ASPECTS = [
  { key: 'square', w: 1080, h: 1080 },
  { key: 'portrait', w: 1080, h: 1350 },
  { key: 'story', w: 1080, h: 1920 },
  { key: 'landscape', w: 1350, h: 1080 },
  { key: 'pin', w: 1080, h: 1620 },
  { key: 'wide', w: 1080, h: 566 },
]

export function LayoutPanel() {
  const t = useT()
  const setBoardSize = useEditor((s) => s.setBoardSize)
  const setGrid = useEditor((s) => s.setGrid)
  const boardWidth = useEditor((s) => s.boardWidth)
  const boardHeight = useEditor((s) => s.boardHeight)
  const gridId = useEditor((s) => s.gridId)
  const gridGap = useEditor((s) => s.gridGap)
  const gridRadius = useEditor((s) => s.gridRadius)
  const setGridGap = useEditor((s) => s.setGridGap)
  const setGridRadius = useEditor((s) => s.setGridRadius)

  const isPreset = ASPECTS.some((a) => a.w === boardWidth && a.h === boardHeight)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ASPECTS.map((a) => (
          <Chip
            key={a.key}
            active={boardWidth === a.w && boardHeight === a.h}
            onClick={() => setBoardSize(a.w, a.h)}
          >
            {t('aspect.' + a.key)}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">
          {t('aspect.custom')}
        </span>
        <input
          type="number"
          min={200}
          max={4096}
          value={boardWidth}
          onChange={(e) =>
            setBoardSize(
              Math.max(200, Math.min(4096, Number(e.target.value) || boardWidth)),
              boardHeight,
            )
          }
          className={`w-20 rounded-lg border bg-slate-800 px-2 py-2 text-sm text-white ${
            isPreset ? 'border-slate-600' : 'border-indigo-500'
          }`}
        />
        <span className="text-slate-500">×</span>
        <input
          type="number"
          min={200}
          max={4096}
          value={boardHeight}
          onChange={(e) =>
            setBoardSize(
              boardWidth,
              Math.max(200, Math.min(4096, Number(e.target.value) || boardHeight)),
            )
          }
          className={`w-20 rounded-lg border bg-slate-800 px-2 py-2 text-sm text-white ${
            isPreset ? 'border-slate-600' : 'border-indigo-500'
          }`}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={gridId === null} onClick={() => setGrid(null)}>
          {t('layout.free')}
        </Chip>
        {GRID_LAYOUTS.map((g) => (
          <Chip key={g.id} active={gridId === g.id} onClick={() => setGrid(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>
      {gridId && (
        <>
          <Slider
            label={t('grid.gap')}
            min={0}
            max={80}
            value={gridGap}
            onChange={setGridGap}
          />
          <Slider
            label={t('grid.radius')}
            min={0}
            max={120}
            value={gridRadius}
            onChange={setGridRadius}
          />
          <p className="text-xs text-slate-400">{t('grid.hint')}</p>
        </>
      )}
    </div>
  )
}

// ---- Text ----------------------------------------------------------------

const FONTS = [
  'Poppins',
  'system-ui',
  'Georgia',
  'Times New Roman',
  'Palatino',
  'Trebuchet MS',
  'Verdana',
  'Impact',
  'Courier New',
  'Comic Sans MS',
  'Brush Script MT',
]

const DEFAULT_CHIP = { color: '#fde68a', padding: 18, radius: 14 }

export function TextPanel() {
  const t = useT()
  const addText = useEditor((s) => s.addText)
  const selectedId = useEditor((s) => s.selectedId)
  const el = useEditor((s) => s.elements.find((e) => e.id === s.selectedId))
  const update = useEditor((s) => s.updateElement)
  const text = el?.type === 'text' ? (el as TextElement) : null

  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton onClick={addText}>{t('text.add')}</PrimaryButton>
      {text && selectedId && (
        <div className="flex flex-col gap-3">
          <input
            value={text.text}
            onChange={(e) => update(selectedId, { text: e.target.value })}
            className="min-h-[44px] rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white"
            placeholder={t('text.placeholder')}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={text.fontFamily.split(',')[0]}
              onChange={(e) =>
                update(selectedId, {
                  fontFamily: `${e.target.value}, system-ui, sans-serif`,
                })
              }
              className="min-h-[44px] rounded-lg border border-slate-600 bg-slate-800 px-2 py-2.5 text-sm text-white"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                update(selectedId, {
                  fontStyle: text.fontStyle.includes('bold') ? 'normal' : 'bold',
                })
              }
              className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-bold transition active:scale-95 ${
                text.fontStyle.includes('bold')
                  ? 'bg-indigo-500 text-white active:bg-indigo-600'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              B
            </button>
            <ColorField
              label={t('common.color')}
              value={text.fill}
              onChange={(v) => update(selectedId, { fill: v })}
            />
          </div>
          <Slider
            label={t('common.size')}
            min={16}
            max={240}
            value={text.fontSize}
            onChange={(v) => update(selectedId, { fontSize: v })}
          />

          {/* Effects */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                update(selectedId, {
                  shadowBlur: text.shadowBlur ? 0 : 14,
                  shadowColor: text.shadowColor ?? '#000000',
                })
              }
              className={`min-h-[40px] rounded-lg px-3 text-sm transition active:scale-95 ${
                text.shadowBlur
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {t('text.shadow')}
            </button>
            <button
              onClick={() =>
                update(selectedId, { chip: text.chip ? undefined : { ...DEFAULT_CHIP } })
              }
              className={`min-h-[40px] rounded-lg px-3 text-sm transition active:scale-95 ${
                text.chip
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {t('text.chip')}
            </button>
            {text.chip && (
              <ColorField
                label={t('common.color')}
                value={text.chip.color}
                onChange={(v) =>
                  update(selectedId, { chip: { ...text.chip!, color: v } })
                }
              />
            )}
          </div>
          <Slider
            label={t('text.outline')}
            min={0}
            max={20}
            value={text.strokeWidth ?? 0}
            onChange={(v) =>
              update(selectedId, {
                strokeWidth: v,
                stroke: text.stroke ?? '#000000',
              })
            }
          />
          {(text.strokeWidth ?? 0) > 0 && (
            <ColorField
              label={t('text.outlineColor')}
              value={text.stroke ?? '#000000'}
              onChange={(v) => update(selectedId, { stroke: v })}
            />
          )}
          <Slider
            label={t('text.curve')}
            min={0}
            max={80}
            value={text.curve ?? 0}
            onChange={(v) => update(selectedId, { curve: v })}
          />
        </div>
      )}
    </div>
  )
}

// ---- Draw ----------------------------------------------------------------

const DRAW_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#ec4899', '#111827', '#ffffff']

export function DrawPanel() {
  const t = useT()
  const brushColor = useEditor((s) => s.brushColor)
  const brushSize = useEditor((s) => s.brushSize)
  const setBrush = useEditor((s) => s.setBrush)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">{t('draw.hint')}</p>
      <div className="flex flex-wrap gap-2">
        {DRAW_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setBrush({ color: c })}
            style={{ background: c }}
            className={`h-11 w-11 rounded-full border transition active:scale-90 ${
              brushColor === c ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-slate-500'
            }`}
          />
        ))}
      </div>
      <ColorField
        label={t('common.color')}
        value={brushColor}
        onChange={(v) => setBrush({ color: v })}
      />
      <Slider
        label={t('draw.size')}
        min={1}
        max={60}
        value={brushSize}
        onChange={(v) => setBrush({ size: v })}
      />
    </div>
  )
}

// ---- Stickers ------------------------------------------------------------

export function StickerPanel() {
  const addSticker = useEditor((s) => s.addSticker)
  const [catIndex, setCatIndex] = useState(0)
  const cat = EMOJI_CATEGORIES[catIndex]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {EMOJI_CATEGORIES.map((c, i) => (
          <button
            key={c.icon}
            onClick={() => setCatIndex(i)}
            title={c.label}
            className={`flex-shrink-0 rounded-lg px-2 py-2.5 text-xl transition active:scale-95 ${
              i === catIndex ? 'bg-slate-700 ring-1 ring-indigo-400' : 'hover:bg-slate-800'
            }`}
          >
            {c.icon}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
        {cat.emoji.map((e) => (
          <button
            key={e}
            onClick={() => addSticker(e)}
            className="rounded-lg py-2 text-2xl transition hover:bg-slate-700 active:scale-90"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- Background ----------------------------------------------------------

const PALETTE = ['#ffffff', '#000000', '#f43f5e', '#6366f1', '#22c55e', '#eab308', '#0ea5e9', '#f97316']

const FRAME_STYLES: FrameStyle[] = ['none', 'solid', 'rounded', 'polaroid']

export function BackgroundPanel() {
  const t = useT()
  const bg = useEditor((s) => s.background)
  const setBg = useEditor((s) => s.setBackground)
  const frame = useEditor((s) => s.frame)
  const setFrame = useEditor((s) => s.setFrame)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Chip active={bg.type === 'solid'} onClick={() => setBg({ type: 'solid' })}>
          {t('bg.solid')}
        </Chip>
        <Chip active={bg.type === 'gradient'} onClick={() => setBg({ type: 'gradient' })}>
          {t('bg.gradient')}
        </Chip>
        <Chip active={bg.type === 'pattern'} onClick={() => setBg({ type: 'pattern' })}>
          {t('bg.pattern')}
        </Chip>
      </div>
      {bg.type === 'solid' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setBg({ color: c })}
                style={{ background: c }}
                className={`h-11 w-11 rounded-full border transition active:scale-90 ${
                  bg.color === c ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-slate-500'
                }`}
              />
            ))}
          </div>
          <ColorField label={t('bg.custom')} value={bg.color} onChange={(v) => setBg({ color: v })} />
        </div>
      )}
      {bg.type === 'gradient' && (
        <div className="flex flex-col gap-3">
          <ColorField label={t('bg.from')} value={bg.gradientFrom} onChange={(v) => setBg({ gradientFrom: v })} />
          <ColorField label={t('bg.to')} value={bg.gradientTo} onChange={(v) => setBg({ gradientTo: v })} />
          <Slider
            label={t('bg.angle')}
            min={0}
            max={360}
            value={bg.gradientAngle}
            onChange={(v) => setBg({ gradientAngle: v })}
          />
        </div>
      )}
      {bg.type === 'pattern' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PATTERN_IDS.map((p) => (
              <button
                key={p}
                onClick={() => setBg({ patternId: p })}
                title={p}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-lg transition active:scale-90 ${
                  bg.patternId === p
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {PATTERN_GLYPH[p]}
              </button>
            ))}
          </div>
          <ColorField label={t('bg.custom')} value={bg.color} onChange={(v) => setBg({ color: v })} />
          <ColorField
            label={t('bg.patternColor')}
            value={bg.patternColor}
            onChange={(v) => setBg({ patternColor: v })}
          />
        </div>
      )}

      {/* Frame */}
      <div className="mt-1 border-t border-slate-700 pt-3">
        <p className="mb-2 text-xs font-medium text-slate-400">{t('frame.title')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FRAME_STYLES.map((s) => (
            <Chip key={s} active={frame.style === s} onClick={() => setFrame({ style: s })}>
              {t('frame.' + s)}
            </Chip>
          ))}
        </div>
        {frame.style !== 'none' && (
          <div className="mt-2 flex flex-col gap-3">
            <ColorField
              label={t('frame.color')}
              value={frame.color}
              onChange={(v) => setFrame({ color: v })}
            />
            <Slider
              label={t('frame.width')}
              min={0.005}
              max={0.12}
              step={0.005}
              value={frame.width}
              onChange={(v) => setFrame({ width: v })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Filters -------------------------------------------------------------

export function FilterPanel() {
  const t = useT()
  const selectedId = useEditor((s) => s.selectedId)
  const el = useEditor((s) => s.elements.find((e) => e.id === s.selectedId))
  const mode = useEditor((s) => s.mode)
  const updateFilters = useEditor((s) => s.updateFilters)
  const updateElement = useEditor((s) => s.updateElement)
  const setCropping = useEditor((s) => s.setCropping)
  const photo = el?.type === 'photo' ? (el as PhotoElement) : null

  if (!photo || !selectedId) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="text-4xl opacity-30">✨</span>
        <p className="text-sm text-slate-400">{t('filter.selectHint')}</p>
      </div>
    )
  }

  const f = photo.filters
  const shape = photo.shape ?? 'rect'
  // Shape cutout + crop only make sense for free-mode photos (grid cells are
  // rectangular and cover-fit by the layout).
  const freePhoto = mode === 'free'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_PRESETS.map((p) => (
          <Chip
            key={p.id}
            active={f.preset === p.id}
            onClick={() => updateFilters(selectedId, { preset: p.id })}
          >
            {t('filter.' + p.id)}
          </Chip>
        ))}
      </div>
      {freePhoto && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t('filter.shape')}</span>
          {PHOTO_SHAPES.map((sh) => (
            <button
              key={sh.id}
              onClick={() => updateElement(selectedId, { shape: sh.id })}
              title={t('shape.' + sh.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition active:scale-90 ${
                shape === sh.id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {sh.glyph}
            </button>
          ))}
          <button
            onClick={() => setCropping(selectedId)}
            className="ml-auto min-h-[40px] rounded-lg bg-slate-700 px-3 text-sm text-slate-100 transition hover:bg-slate-600 active:scale-95"
          >
            ✂️ {t('filter.crop')}
          </button>
        </div>
      )}
      <Slider
        label={t('filter.brightness')}
        min={-0.5}
        max={0.5}
        step={0.02}
        value={f.brightness}
        onChange={(v) => updateFilters(selectedId, { brightness: v })}
      />
      <Slider
        label={t('filter.contrast')}
        min={-60}
        max={60}
        value={f.contrast}
        onChange={(v) => updateFilters(selectedId, { contrast: v })}
      />
      <Slider
        label={t('filter.saturation')}
        min={-2}
        max={4}
        step={0.1}
        value={f.saturation}
        onChange={(v) => updateFilters(selectedId, { saturation: v })}
      />
      <Slider
        label={t('filter.blur')}
        min={0}
        max={40}
        value={f.blur}
        onChange={(v) => updateFilters(selectedId, { blur: v })}
      />
      <Slider
        label={t('filter.vignette')}
        min={0}
        max={0.9}
        step={0.05}
        value={f.vignette}
        onChange={(v) => updateFilters(selectedId, { vignette: v })}
      />
    </div>
  )
}
