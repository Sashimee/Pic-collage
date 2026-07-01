// Core data model for the editor. Every visible item on the board is a
// `CanvasElement` — a discriminated union keyed by `type`. New element kinds
// (text, sticker, …) plug in here without touching the transform/selection code.

export type ElementType = 'photo' | 'text' | 'sticker'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

export type FilterPreset =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'vivid'
  | 'cool'
  | 'warm'

export interface PhotoFilters {
  brightness: number // Konva Brighten:  -1 .. 1
  contrast: number //   Konva Contrast: -100 .. 100
  saturation: number // Konva HSL:        -2 .. 10
  preset: FilterPreset
}

export interface PhotoElement extends BaseElement {
  type: 'photo'
  src: string // object URL created from the imported File
  width: number // intrinsic display size (design units)
  height: number
  filters: PhotoFilters
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fill: string
  fontStyle: string // 'normal' | 'bold' | 'italic' | 'bold italic'
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  emoji: string
  fontSize: number
}

export type CanvasElement = PhotoElement | TextElement | StickerElement

// ---- Background ----------------------------------------------------------

export type BackgroundType = 'solid' | 'gradient'

export interface Background {
  type: BackgroundType
  color: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number // degrees, 0 = left→right
}

// ---- Grid collage mode ---------------------------------------------------

export type EditorMode = 'free' | 'grid'

// Cells are normalised to the 0..1 unit square and scaled to the board size.
export interface GridCell {
  x: number
  y: number
  width: number
  height: number
}

export interface GridLayout {
  id: string
  label: string
  count: number
  cells: GridCell[]
}

export const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  preset: 'none',
}
