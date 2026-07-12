import type { GridLayout } from '../types'

// Normalised (0..1) collage layouts. A small gutter is applied at render time,
// so cells here tile the full unit square edge-to-edge. Rendered as visual
// thumbnails in the layout picker (see LayoutPreview), so no text label needed.
export const GRID_LAYOUTS: GridLayout[] = [
  // ---- 2 photos ----
  {
    id: '2-v',
    label: '2',
    count: 2,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: '2-h',
    label: '2',
    count: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: '2-big-small',
    label: '2',
    count: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.66 },
      { x: 0, y: 0.66, width: 1, height: 0.34 },
    ],
  },
  // ---- 3 photos ----
  {
    id: '3-col',
    label: '3',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
    ],
  },
  {
    id: '3-strip-h',
    label: '3',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
    ],
  },
  {
    id: '3-1big-left',
    label: '3',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 0.5 },
      { x: 0.6, y: 0.5, width: 0.4, height: 0.5 },
    ],
  },
  {
    id: '3-1big-top',
    label: '3',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.6 },
      { x: 0, y: 0.6, width: 0.5, height: 0.4 },
      { x: 0.5, y: 0.6, width: 0.5, height: 0.4 },
    ],
  },
  // ---- 4 photos ----
  {
    id: '4-grid',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: '4-col',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 0.25, height: 1 },
      { x: 0.25, y: 0, width: 0.25, height: 1 },
      { x: 0.5, y: 0, width: 0.25, height: 1 },
      { x: 0.75, y: 0, width: 0.25, height: 1 },
    ],
  },
  {
    id: '4-row',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.25 },
      { x: 0, y: 0.25, width: 1, height: 0.25 },
      { x: 0, y: 0.5, width: 1, height: 0.25 },
      { x: 0, y: 0.75, width: 1, height: 0.25 },
    ],
  },
  {
    id: '4-1big-top',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.6 },
      { x: 0, y: 0.6, width: 1 / 3, height: 0.4 },
      { x: 1 / 3, y: 0.6, width: 1 / 3, height: 0.4 },
      { x: 2 / 3, y: 0.6, width: 1 / 3, height: 0.4 },
    ],
  },
  {
    id: '4-1big-left',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 1 / 3 },
      { x: 0.6, y: 1 / 3, width: 0.4, height: 1 / 3 },
      { x: 0.6, y: 2 / 3, width: 0.4, height: 1 / 3 },
    ],
  },
  {
    id: '4-pinwheel',
    label: '4',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 0.4 },
      { x: 0.6, y: 0, width: 0.4, height: 0.6 },
      { x: 0.4, y: 0.6, width: 0.6, height: 0.4 },
      { x: 0, y: 0.4, width: 0.4, height: 0.6 },
    ],
  },
  // ---- 5 photos ----
  {
    id: '5-1big-left',
    label: '5',
    count: 5,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 0.25 },
      { x: 0.6, y: 0.25, width: 0.4, height: 0.25 },
      { x: 0.6, y: 0.5, width: 0.4, height: 0.25 },
      { x: 0.6, y: 0.75, width: 0.4, height: 0.25 },
    ],
  },
  {
    id: '5-1big-top',
    label: '5',
    count: 5,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.6 },
      { x: 0, y: 0.6, width: 0.25, height: 0.4 },
      { x: 0.25, y: 0.6, width: 0.25, height: 0.4 },
      { x: 0.5, y: 0.6, width: 0.25, height: 0.4 },
      { x: 0.75, y: 0.6, width: 0.25, height: 0.4 },
    ],
  },
  {
    id: '5-2over3',
    label: '5',
    count: 5,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
  // ---- 6 photos ----
  {
    id: '6-grid',
    label: '6',
    count: 6,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 0.5 },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.5 },
    ],
  },
  {
    id: '6-2x3',
    label: '6',
    count: 6,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 0, width: 0.5, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 1 / 3, width: 0.5, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 0.5, height: 1 / 3 },
      { x: 0.5, y: 2 / 3, width: 0.5, height: 1 / 3 },
    ],
  },
  {
    id: '6-1big',
    label: '6',
    count: 6,
    cells: [
      { x: 0, y: 0, width: 2 / 3, height: 2 / 3 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
    ],
  },
  // ---- 7 photos ----
  {
    id: '7-1big-top',
    label: '7',
    count: 7,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1 / 3, height: 0.25 },
      { x: 1 / 3, y: 0.5, width: 1 / 3, height: 0.25 },
      { x: 2 / 3, y: 0.5, width: 1 / 3, height: 0.25 },
      { x: 0, y: 0.75, width: 1 / 3, height: 0.25 },
      { x: 1 / 3, y: 0.75, width: 1 / 3, height: 0.25 },
      { x: 2 / 3, y: 0.75, width: 1 / 3, height: 0.25 },
    ],
  },
  // ---- 8 photos ----
  {
    id: '8-2x4',
    label: '8',
    count: 8,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.25 },
      { x: 0.5, y: 0, width: 0.5, height: 0.25 },
      { x: 0, y: 0.25, width: 0.5, height: 0.25 },
      { x: 0.5, y: 0.25, width: 0.5, height: 0.25 },
      { x: 0, y: 0.5, width: 0.5, height: 0.25 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.25 },
      { x: 0, y: 0.75, width: 0.5, height: 0.25 },
      { x: 0.5, y: 0.75, width: 0.5, height: 0.25 },
    ],
  },
  // ---- 9 photos ----
  {
    id: '9-grid',
    label: '9',
    count: 9,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, width: 1 / 3, height: 1 / 3 },
    ],
  },
]

export function getGridById(id: string): GridLayout | undefined {
  return GRID_LAYOUTS.find((g) => g.id === id)
}
