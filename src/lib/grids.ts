import type { GridLayout } from '../types'

// Normalised (0..1) collage layouts. A small gutter is applied at render time,
// so cells here tile the full unit square edge-to-edge.
export const GRID_LAYOUTS: GridLayout[] = [
  {
    id: '2-v',
    label: '2 ▏▎',
    count: 2,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
  },
  {
    id: '2-h',
    label: '2 ⬒',
    count: 2,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.5 },
      { x: 0, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: '3-col',
    label: '3 ▕▏▏',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 1 / 3, height: 1 },
      { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
      { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
    ],
  },
  {
    id: '3-1big',
    label: '3 ◱',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 0.6, height: 1 },
      { x: 0.6, y: 0, width: 0.4, height: 0.5 },
      { x: 0.6, y: 0.5, width: 0.4, height: 0.5 },
    ],
  },
  {
    id: '4-grid',
    label: '4 ▦',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0, width: 0.5, height: 0.5 },
      { x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: '4-1big',
    label: '4 ◰',
    count: 4,
    cells: [
      { x: 0, y: 0, width: 1, height: 0.6 },
      { x: 0, y: 0.6, width: 1 / 3, height: 0.4 },
      { x: 1 / 3, y: 0.6, width: 1 / 3, height: 0.4 },
      { x: 2 / 3, y: 0.6, width: 1 / 3, height: 0.4 },
    ],
  },
  {
    id: '5-1big',
    label: '5 ◱',
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
    id: '6-grid',
    label: '6 ▦',
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
    id: '9-grid',
    label: '9 ▦',
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
  {
    id: '3-strip-h',
    label: '3 ☰',
    count: 3,
    cells: [
      { x: 0, y: 0, width: 1, height: 1 / 3 },
      { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
      { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
    ],
  },
]

export function getGridById(id: string): GridLayout | undefined {
  return GRID_LAYOUTS.find((g) => g.id === id)
}
