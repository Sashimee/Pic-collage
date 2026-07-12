import { create } from 'zustand'
import type {
  Background,
  CanvasElement,
  EditorMode,
  Frame,
  PhotoElement,
  PhotoFilters,
  StickerElement,
  TextElement,
} from '../types'
import { DEFAULT_FILTERS } from '../types'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// ---- Undo/redo history ----------------------------------------------------
// A snapshot is the whole editable "document" (everything except the transient
// selection + the history stacks themselves). Actions push the pre-mutation
// snapshot onto `past` and clear `future`. Rapid edits with the same coalesce
// key (e.g. dragging a slider) collapse into a single undo step.

const HISTORY_LIMIT = 60
let lastKey = ''
let lastAt = 0

interface Snapshot {
  elements: CanvasElement[]
  background: Background
  mode: EditorMode
  gridId: string | null
  gridGap: number
  gridRadius: number
  frame: Frame
  boardWidth: number
  boardHeight: number
}

const snap = (s: EditorState): Snapshot => ({
  elements: s.elements,
  background: s.background,
  mode: s.mode,
  gridId: s.gridId,
  gridGap: s.gridGap,
  gridRadius: s.gridRadius,
  frame: s.frame,
  boardWidth: s.boardWidth,
  boardHeight: s.boardHeight,
})

// Returns the `past`/`future` patch to spread into a mutating `set`. When a
// `key` repeats within the coalesce window the step is merged (no new entry).
const record = (s: EditorState, key = ''): Partial<EditorState> => {
  const now = Date.now()
  if (key && key === lastKey && now - lastAt < 600) {
    lastAt = now
    return {}
  }
  lastKey = key
  lastAt = now
  return { past: [...s.past, snap(s)].slice(-HISTORY_LIMIT), future: [] }
}

interface EditorState {
  boardWidth: number
  boardHeight: number
  background: Background
  mode: EditorMode
  gridId: string | null
  gridGap: number
  gridRadius: number
  frame: Frame
  elements: CanvasElement[]
  selectedId: string | null

  past: Snapshot[]
  future: Snapshot[]

  // selectors
  selected: () => CanvasElement | undefined

  // element actions
  addPhoto: (src: string, naturalWidth: number, naturalHeight: number) => void
  addText: () => void
  addSticker: (emoji: string) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  updateFilters: (id: string, patch: Partial<PhotoFilters>) => void
  duplicateElement: (id: string) => void
  removeElement: (id: string) => void
  select: (id: string | null) => void

  // z-order
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void

  // board / background / mode / frame / grid style
  setBackground: (patch: Partial<Background>) => void
  setMode: (mode: EditorMode) => void
  setGrid: (gridId: string | null) => void
  setGridGap: (gap: number) => void
  setGridRadius: (radius: number) => void
  setFrame: (patch: Partial<Frame>) => void
  setBoardSize: (width: number, height: number) => void
  clearAll: () => void

  // history
  undo: () => void
  redo: () => void
}

const DEFAULT_BACKGROUND: Background = {
  type: 'solid',
  color: '#ffffff',
  gradientFrom: '#6366f1',
  gradientTo: '#ec4899',
  gradientAngle: 45,
}

const DEFAULT_FRAME: Frame = {
  style: 'none',
  color: '#ffffff',
  width: 0.04,
}

export const useEditor = create<EditorState>((set, get) => ({
  boardWidth: 1080,
  boardHeight: 1350,
  background: DEFAULT_BACKGROUND,
  mode: 'free',
  gridId: null,
  gridGap: 12,
  gridRadius: 0,
  frame: DEFAULT_FRAME,
  elements: [],
  selectedId: null,

  past: [],
  future: [],

  selected: () => get().elements.find((e) => e.id === get().selectedId),

  addPhoto: (src, naturalWidth, naturalHeight) =>
    set((s) => {
      // Fit the new photo to ~55% of the board's shorter axis, centered.
      const target = Math.min(s.boardWidth, s.boardHeight) * 0.55
      const ratio = naturalWidth / naturalHeight
      let w = target
      let h = target / ratio
      if (h > target) {
        h = target
        w = target * ratio
      }
      const photo: PhotoElement = {
        id: uid(),
        type: 'photo',
        src,
        width: w,
        height: h,
        x: s.boardWidth / 2 - w / 2,
        y: s.boardHeight / 2 - h / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        filters: { ...DEFAULT_FILTERS },
      }
      return { elements: [...s.elements, photo], selectedId: photo.id, ...record(s) }
    }),

  addText: () =>
    set((s) => {
      const text: TextElement = {
        id: uid(),
        type: 'text',
        text: 'Tap to edit',
        fontFamily: 'Poppins, system-ui, sans-serif',
        fontSize: 72,
        fill: '#111827',
        fontStyle: 'bold',
        x: s.boardWidth / 2 - 200,
        y: s.boardHeight / 2 - 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      }
      return { elements: [...s.elements, text], selectedId: text.id, ...record(s) }
    }),

  addSticker: (emoji) =>
    set((s) => {
      const sticker: StickerElement = {
        id: uid(),
        type: 'sticker',
        emoji,
        fontSize: 160,
        x: s.boardWidth / 2 - 80,
        y: s.boardHeight / 2 - 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      }
      return { elements: [...s.elements, sticker], selectedId: sticker.id, ...record(s) }
    }),

  updateElement: (id, patch) =>
    set((s) => ({
      // Coalesce rapid edits to the same element (slider drags, live typing).
      ...record(s, 'update:' + id),
      elements: s.elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as CanvasElement) : e,
      ),
    })),

  updateFilters: (id, patch) =>
    set((s) => ({
      ...record(s, 'filters:' + id),
      elements: s.elements.map((e) =>
        e.id === id && e.type === 'photo'
          ? { ...e, filters: { ...e.filters, ...patch } }
          : e,
      ),
    })),

  duplicateElement: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return {}
      const copy = {
        ...el,
        id: uid(),
        x: el.x + 40,
        y: el.y + 40,
        // photos keep the same object URL — it's just another reference.
        ...(el.type === 'photo' ? { filters: { ...el.filters } } : {}),
      } as CanvasElement
      return { elements: [...s.elements, copy], selectedId: copy.id, ...record(s) }
    }),

  removeElement: (id) =>
    set((s) => {
      // Note: we intentionally do NOT revoke the photo's object URL here — undo
      // must be able to bring the element back with its bitmap intact. Blob URLs
      // are released on "New" and on page unload (see App.tsx).
      return {
        elements: s.elements.filter((e) => e.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
        ...record(s),
      }
    }),

  select: (id) => set({ selectedId: id }),

  bringForward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i < 0 || i === s.elements.length - 1) return {}
      const els = [...s.elements]
      ;[els[i], els[i + 1]] = [els[i + 1], els[i]]
      return { elements: els, ...record(s) }
    }),

  sendBackward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i <= 0) return {}
      const els = [...s.elements]
      ;[els[i], els[i - 1]] = [els[i - 1], els[i]]
      return { elements: els, ...record(s) }
    }),

  bringToFront: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return {}
      return { elements: [...s.elements.filter((e) => e.id !== id), el], ...record(s) }
    }),

  sendToBack: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return {}
      return { elements: [el, ...s.elements.filter((e) => e.id !== id)], ...record(s) }
    }),

  setBackground: (patch) =>
    set((s) => ({ background: { ...s.background, ...patch }, ...record(s, 'bg') })),

  setMode: (mode) => set((s) => ({ mode, ...record(s) })),

  setGrid: (gridId) =>
    set((s) => ({
      gridId,
      mode: gridId ? 'grid' : 'free',
      selectedId: null,
      ...record(s),
    })),

  setGridGap: (gap) => set((s) => ({ gridGap: gap, ...record(s, 'gridGap') })),

  setGridRadius: (radius) =>
    set((s) => ({ gridRadius: radius, ...record(s, 'gridRadius') })),

  setFrame: (patch) =>
    set((s) => ({ frame: { ...s.frame, ...patch }, ...record(s, 'frame') })),

  setBoardSize: (width, height) =>
    set((s) => ({ boardWidth: width, boardHeight: height, ...record(s, 'boardSize') })),

  clearAll: () =>
    set((s) => {
      s.elements.forEach((e) => {
        if (e.type === 'photo' && e.src.startsWith('blob:')) {
          URL.revokeObjectURL(e.src)
        }
      })
      return {
        elements: [],
        selectedId: null,
        gridId: null,
        mode: 'free',
        frame: DEFAULT_FRAME,
        past: [],
        future: [],
      }
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {}
      lastKey = ''
      const prev = s.past[s.past.length - 1]
      return {
        ...prev,
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future].slice(0, HISTORY_LIMIT),
        selectedId: null,
      }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      lastKey = ''
      const next = s.future[0]
      return {
        ...next,
        past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selectedId: null,
      }
    }),
}))

// Dev-only handle so the editor state can be driven from the console / tests.
if (import.meta.env.DEV) {
  ;(window as unknown as { __editor?: typeof useEditor }).__editor = useEditor
}
