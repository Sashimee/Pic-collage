import type { Frame } from '../types'
import { getGridById } from './grids'

// A collage template bundles a grid layout with the board/style presets that
// make it look intentional (aspect ratio, gutter, corner radius, frame).
// Applying one sets grid mode + these fields, then hands off to the photo
// picker so the user immediately fills the slots.
export interface Template {
  id: string
  titleKey: string
  gridId: string
  boardWidth?: number
  boardHeight?: number
  gridGap?: number
  gridRadius?: number
  frame?: Partial<Frame>
}

export const TEMPLATES: Template[] = [
  { id: '2-v', titleKey: 'template.2v', gridId: '2-v' },
  { id: '2-h', titleKey: 'template.2h', gridId: '2-h' },
  { id: '3-col', titleKey: 'template.3col', gridId: '3-col' },
  { id: '4-grid', titleKey: 'template.4grid', gridId: '4-grid' },
  { id: '4-pinwheel', titleKey: 'template.4pinwheel', gridId: '4-pinwheel' },
  {
    id: 'story',
    titleKey: 'template.story',
    gridId: '3-strip-h',
    boardWidth: 1080,
    boardHeight: 1920,
    gridGap: 8,
  },
  {
    id: 'photobooth',
    titleKey: 'template.photobooth',
    gridId: '4-col',
    boardWidth: 1080,
    boardHeight: 1920,
    gridGap: 6,
    frame: { style: 'solid', color: '#ffffff', width: 0.02 },
  },
  {
    id: 'moodboard',
    titleKey: 'template.moodboard',
    gridId: 'moodboard',
    gridGap: 16,
  },
  {
    id: 'celebration',
    titleKey: 'template.celebration',
    gridId: 'celebration',
    gridGap: 10,
    gridRadius: 500,
  },
]

// Every template must resolve to a real grid layout — guards against a typo'd
// gridId silently rendering an empty board.
export function getTemplateLayout(t: Template) {
  return getGridById(t.gridId)
}
