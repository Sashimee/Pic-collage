// Preset polygon shapes for grid cells. Each vertex is normalised 0..1 within
// the cell.  Import and assign to `cell.polygon` when `cell.shape === 'polygon'`.

export type ShapePreset =
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'pentagon'
  | 'octagon'

export const CELL_SHAPE_PRESETS: Record<
  ShapePreset,
  { x: number; y: number }[]
> = {
  triangle: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  diamond: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 },
  ],
  hexagon: [
    { x: 0.25, y: 0 },
    { x: 0.75, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.75, y: 1 },
    { x: 0.25, y: 1 },
    { x: 0, y: 0.5 },
  ],
  pentagon: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.4 },
    { x: 0.82, y: 1 },
    { x: 0.18, y: 1 },
    { x: 0, y: 0.4 },
  ],
  octagon: [
    { x: 0.3, y: 0 },
    { x: 0.7, y: 0 },
    { x: 1, y: 0.3 },
    { x: 1, y: 0.7 },
    { x: 0.7, y: 1 },
    { x: 0.3, y: 1 },
    { x: 0, y: 0.7 },
    { x: 0, y: 0.3 },
  ],
}
