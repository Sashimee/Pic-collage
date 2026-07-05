import { useRef, useState } from 'react'
import { useEditor } from '../store/editorStore'
import { GRID_LAYOUTS } from '../lib/grids'
import { FILTER_PRESETS } from '../lib/filters'
import { loadPhotoMeta } from '../lib/importPhotos'
import type { PhotoElement, TextElement } from '../types'
import { Chip, ColorField, PrimaryButton, Slider } from './ui'
import { useT } from '../i18n/useLang'
import { EMOJI_CATEGORIES } from '../lib/emojis'

async function importFiles(
  files: FileList,
  add: (src: string, w: number, h: number) => void,
) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    try {
      const meta = await loadPhotoMeta(file)
      add(meta.src, meta.width, meta.height)
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
]

export function LayoutPanel() {
  const t = useT()
  const setBoardSize = useEditor((s) => s.setBoardSize)
  const setGrid = useEditor((s) => s.setGrid)
  const boardWidth = useEditor((s) => s.boardWidth)
  const boardHeight = useEditor((s) => s.boardHeight)
  const gridId = useEditor((s) => s.gridId)

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
        <p className="text-xs text-slate-400">{t('grid.hint')}</p>
      )}
    </div>
  )
}

// ---- Text ----------------------------------------------------------------

const FONTS = [
  'Poppins',
  'system-ui',
  'Georgia',
  'Impact',
  'Courier New',
  'Comic Sans MS',
]

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
        </div>
      )}
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

export function BackgroundPanel() {
  const t = useT()
  const bg = useEditor((s) => s.background)
  const setBg = useEditor((s) => s.setBackground)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Chip active={bg.type === 'solid'} onClick={() => setBg({ type: 'solid' })}>
          {t('bg.solid')}
        </Chip>
        <Chip active={bg.type === 'gradient'} onClick={() => setBg({ type: 'gradient' })}>
          {t('bg.gradient')}
        </Chip>
      </div>
      {bg.type === 'solid' ? (
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
      ) : (
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
    </div>
  )
}

// ---- Filters -------------------------------------------------------------

export function FilterPanel() {
  const t = useT()
  const selectedId = useEditor((s) => s.selectedId)
  const el = useEditor((s) => s.elements.find((e) => e.id === s.selectedId))
  const updateFilters = useEditor((s) => s.updateFilters)
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
    </div>
  )
}
