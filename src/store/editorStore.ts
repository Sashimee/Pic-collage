import { create } from 'zustand'
import type {
  Background,
  CanvasElement,
  EditorMode,
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

interface EditorState {
  boardWidth: number
  boardHeight: number
  background: Background
  mode: EditorMode
  gridId: string | null
  elements: CanvasElement[]
  selectedId: string | null

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

  // board / background / mode
  setBackground: (patch: Partial<Background>) => void
  setMode: (mode: EditorMode) => void
  setGrid: (gridId: string | null) => void
  setBoardSize: (width: number, height: number) => void
  clearAll: () => void
}

const DEFAULT_BACKGROUND: Background = {
  type: 'solid',
  color: '#ffffff',
  gradientFrom: '#6366f1',
  gradientTo: '#ec4899',
  gradientAngle: 45,
}

export const useEditor = create<EditorState>((set, get) => ({
  boardWidth: 1080,
  boardHeight: 1350,
  background: DEFAULT_BACKGROUND,
  mode: 'free',
  gridId: null,
  elements: [],
  selectedId: null,

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
      return { elements: [...s.elements, photo], selectedId: photo.id }
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
      return { elements: [...s.elements, text], selectedId: text.id }
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
      return { elements: [...s.elements, sticker], selectedId: sticker.id }
    }),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as CanvasElement) : e,
      ),
    })),

  updateFilters: (id, patch) =>
    set((s) => ({
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
      return { elements: [...s.elements, copy], selectedId: copy.id }
    }),

  removeElement: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      const stillUsed =
        el?.type === 'photo' &&
        s.elements.some((e) => e.id !== id && e.type === 'photo' && e.src === el.src)
      if (el?.type === 'photo' && el.src.startsWith('blob:') && !stillUsed) {
        URL.revokeObjectURL(el.src)
      }
      return {
        elements: s.elements.filter((e) => e.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }
    }),

  select: (id) => set({ selectedId: id }),

  bringForward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i < 0 || i === s.elements.length - 1) return {}
      const els = [...s.elements]
      ;[els[i], els[i + 1]] = [els[i + 1], els[i]]
      return { elements: els }
    }),

  sendBackward: (id) =>
    set((s) => {
      const i = s.elements.findIndex((e) => e.id === id)
      if (i <= 0) return {}
      const els = [...s.elements]
      ;[els[i], els[i - 1]] = [els[i - 1], els[i]]
      return { elements: els }
    }),

  bringToFront: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return {}
      return { elements: [...s.elements.filter((e) => e.id !== id), el] }
    }),

  sendToBack: (id) =>
    set((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return {}
      return { elements: [el, ...s.elements.filter((e) => e.id !== id)] }
    }),

  setBackground: (patch) =>
    set((s) => ({ background: { ...s.background, ...patch } })),

  setMode: (mode) => set({ mode }),

  setGrid: (gridId) =>
    set(() => ({
      gridId,
      mode: gridId ? 'grid' : 'free',
      selectedId: null,
    })),

  setBoardSize: (width, height) => set({ boardWidth: width, boardHeight: height }),

  clearAll: () =>
    set((s) => {
      s.elements.forEach((e) => {
        if (e.type === 'photo' && e.src.startsWith('blob:')) {
          URL.revokeObjectURL(e.src)
        }
      })
      return { elements: [], selectedId: null, gridId: null, mode: 'free' }
    }),
}))

// Dev-only handle so the editor state can be driven from the console / tests.
if (import.meta.env.DEV) {
  ;(window as unknown as { __editor?: typeof useEditor }).__editor = useEditor
}
