// Core data model for the editor. Every visible item on the board is a
// `CanvasElement` — a discriminated union keyed by `type`. New element kinds
// (text, sticker, …) plug in here without touching the transform/selection code.

export type ElementType = 'photo' | 'text' | 'sticker' | 'drawing'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  /**
   * If true, the element is hidden from the canvas.
   */
  hidden?: boolean
  /**
   * If true, the element cannot be selected or edited.
   */
  locked?: boolean
  /**
   * Opacity 0..1 (default 1)
   */
  opacity?: number
  /**
   * Konva globalCompositeOperation blend mode.
   */
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
}

export type FilterPreset =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'vivid'
  | 'cool'
  | 'warm'
  | 'fade'
  | 'noir'
  | 'punch'

export interface PhotoFilters {
  brightness: number // Konva Brighten:  -1 .. 1
  contrast: number //   Konva Contrast: -100 .. 100
  saturation: number // Konva HSL:        -2 .. 10
  blur: number //       Konva Blur radius: 0 .. 40
  vignette: number //   dark-edge overlay strength: 0 .. 0.9
  preset: FilterPreset
}

// Non-AI "cutout": clip a photo into a decorative shape.
export type PhotoShape = 'rect' | 'circle' | 'star' | 'heart'

// Source-pixel crop rectangle (Konva Image `crop`).
export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface PhotoElement extends BaseElement {
  type: 'photo'
  src: string // object URL created from the imported File
  photoId?: string // IndexedDB key for the source blob (persistence)
  width: number // intrinsic display size (design units)
  height: number
  filters: PhotoFilters
  shape?: PhotoShape // defaults to 'rect'
  crop?: CropRect // source-pixel crop; undefined = whole image
  // Per-cell framing in grid mode (ignored in free mode):
  cellZoom?: number // zoom within the cell, >= 1; default 1 = plain cover-fit
  cellPan?: { x: number; y: number } // normalised pan, each axis in [-1, 1]; default centred
}

export interface TextChip {
  color: string
  padding: number
  radius: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fill: string
  fontStyle: string // 'normal' | 'bold' | 'italic' | 'bold italic'
  stroke?: string //       outline color
  strokeWidth?: number //  outline width (0 = none)
  shadowColor?: string
  shadowBlur?: number //   drop-shadow blur (0 = none)
  chip?: TextChip //       tape/scrapbook background behind the text
  curve?: number //        arch depth in px (0 = straight)
}

export interface StickerElement extends BaseElement {
  type: 'sticker'
  emoji: string
  fontSize: number
}

export interface DrawingElement extends BaseElement {
  type: 'drawing'
  points: number[] // flat [x0,y0,x1,y1,…] in board units, relative to x/y
  stroke: string
  strokeWidth: number
}

export type CanvasElement =
  | PhotoElement
  | TextElement
  | StickerElement
  | DrawingElement

// ---- Background ----------------------------------------------------------

export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'photo'

export type PatternId = 'dots' | 'stripes' | 'grid' | 'checker' | 'hearts'

export interface Background {
  type: BackgroundType
  color: string
  gradientFrom: string
  gradientTo: string
  gradientAngle: number // degrees, 0 = left→right
  patternId: PatternId
  patternColor: string // foreground/motif color (background uses `color`)
  photoSrc?: string // object URL for a full-board photo background
  photoId?: string // IndexedDB key for the source blob (persistence)
}

// ---- Board frame ---------------------------------------------------------

export type FrameStyle = 'none' | 'solid' | 'rounded' | 'polaroid'

export interface Frame {
  style: FrameStyle
  color: string
  width: number // fraction of the board's shorter axis (0..0.15)
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
  blur: 0,
  vignette: 0,
  preset: 'none',
}
