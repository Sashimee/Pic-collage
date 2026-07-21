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
  category?: string
  boardWidth?: number
  boardHeight?: number
  gridGap?: number
  gridRadius?: number
  frame?: Partial<Frame>
}

export const TEMPLATES: Template[] = [
  // ---- Classic / balanced grids ----
  { id: '2-v', titleKey: 'template.2v', gridId: '2-v', category: 'classic' },
  { id: '2-h', titleKey: 'template.2h', gridId: '2-h', category: 'classic' },
  { id: '2-big-small', titleKey: 'template.2bigSmall', gridId: '2-big-small', category: 'classic' },
  { id: '2-overlap', titleKey: 'template.2overlap', gridId: '2-overlap', category: 'creative' },

  { id: '3-col', titleKey: 'template.3col', gridId: '3-col', category: 'classic' },
  { id: '3-strip-h', titleKey: 'template.3strip', gridId: '3-strip-h', category: 'social' },
  { id: '3-1big-left', titleKey: 'template.3bigLeft', gridId: '3-1big-left', category: 'classic' },
  { id: '3-1big-top', titleKey: 'template.3bigTop', gridId: '3-1big-top', category: 'classic' },
  { id: '3-tri', titleKey: 'template.3tri', gridId: '3-tri', category: 'creative' },
  { id: '3-magazine', titleKey: 'template.3magazine', gridId: '3-magazine', category: 'editorial' },

  { id: '4-grid', titleKey: 'template.4grid', gridId: '4-grid', category: 'classic' },
  { id: '4-col', titleKey: 'template.4col', gridId: '4-col', category: 'classic' },
  { id: '4-row', titleKey: 'template.4row', gridId: '4-row', category: 'classic' },
  { id: '4-1big-top', titleKey: 'template.4bigTop', gridId: '4-1big-top', category: 'classic' },
  { id: '4-1big-left', titleKey: 'template.4bigLeft', gridId: '4-1big-left', category: 'classic' },
  { id: '4-pinwheel', titleKey: 'template.4pinwheel', gridId: '4-pinwheel', category: 'creative' },
  { id: '4-magazine', titleKey: 'template.4magazine', gridId: '4-magazine', category: 'editorial' },
  { id: '4-story', titleKey: 'template.4story', gridId: '4-story', category: 'social' },

  { id: '5-1big-left', titleKey: 'template.5bigLeft', gridId: '5-1big-left', category: 'classic' },
  { id: '5-1big-top', titleKey: 'template.5bigTop', gridId: '5-1big-top', category: 'classic' },
  { id: '5-2over3', titleKey: 'template.5twoOverThree', gridId: '5-2over3', category: 'classic' },
  { id: '5-circle', titleKey: 'template.5circle', gridId: '5-circle', category: 'creative' },
  { id: '5-pinterest', titleKey: 'template.5pinterest', gridId: '5-pinterest', category: 'social' },
  { id: '5-magazine', titleKey: 'template.5magazine', gridId: '5-magazine', category: 'editorial' },
  { id: '5-strip', titleKey: 'template.5strip', gridId: '5-strip', category: 'social' },

  { id: '6-grid', titleKey: 'template.6grid', gridId: '6-grid', category: 'classic' },
  { id: '6-2x3', titleKey: 'template.6twoXthree', gridId: '6-2x3', category: 'classic' },
  { id: '6-1big', titleKey: 'template.6big', gridId: '6-1big', category: 'classic' },
  { id: '6-pinterest', titleKey: 'template.6pinterest', gridId: '6-pinterest', category: 'social' },
  { id: '6-magazine', titleKey: 'template.6magazine', gridId: '6-magazine', category: 'editorial' },
  { id: '6-story', titleKey: 'template.6story', gridId: '6-story', category: 'social' },
  { id: '6-circle', titleKey: 'template.6circle', gridId: '6-circle', category: 'creative' },

  { id: '7-1big-top', titleKey: 'template.7bigTop', gridId: '7-1big-top', category: 'classic' },
  { id: '7-magazine', titleKey: 'template.7magazine', gridId: '7-magazine', category: 'editorial' },
  { id: '7-pinterest', titleKey: 'template.7pinterest', gridId: '7-pinterest', category: 'social' },
  { id: '7-strip', titleKey: 'template.7strip', gridId: '7-strip', category: 'social' },
  { id: '7-circle', titleKey: 'template.7circle', gridId: '7-circle', category: 'creative' },

  { id: '8-2x4', titleKey: 'template.8twoXfour', gridId: '8-2x4', category: 'classic' },
  { id: '8-magazine', titleKey: 'template.8magazine', gridId: '8-magazine', category: 'editorial' },
  { id: '8-pinterest', titleKey: 'template.8pinterest', gridId: '8-pinterest', category: 'social' },
  { id: '8-story', titleKey: 'template.8story', gridId: '8-story', category: 'social' },

  { id: '9-grid', titleKey: 'template.9grid', gridId: '9-grid', category: 'classic' },
  { id: '9-circle', titleKey: 'template.9circle', gridId: '9-circle', category: 'creative' },
  { id: '9-magazine', titleKey: 'template.9magazine', gridId: '9-magazine', category: 'editorial' },
  { id: '9-pinterest', titleKey: 'template.9pinterest', gridId: '9-pinterest', category: 'social' },

  { id: '10-grid', titleKey: 'template.10grid', gridId: '10-grid', category: 'classic' },
  { id: '10-circle', titleKey: 'template.10circle', gridId: '10-circle', category: 'creative' },
  { id: '10-magazine', titleKey: 'template.10magazine', gridId: '10-magazine', category: 'editorial' },

  { id: '12-grid', titleKey: 'template.12grid', gridId: '12-grid', category: 'classic' },
  { id: '12-masonry', titleKey: 'template.12masonry', gridId: '12-masonry', category: 'social' },
  { id: '12-circle', titleKey: 'template.12circle', gridId: '12-circle', category: 'creative' },

  { id: '16-grid', titleKey: 'template.16grid', gridId: '16-grid', category: 'classic' },

  // ---- Template-specific asymmetric layouts ----
  {
    id: 'story',
    titleKey: 'template.story',
    gridId: '3-strip-h',
    category: 'social',
    boardWidth: 1080,
    boardHeight: 1920,
    gridGap: 8,
  },
  {
    id: 'photobooth',
    titleKey: 'template.photobooth',
    gridId: '4-col',
    category: 'social',
    boardWidth: 1080,
    boardHeight: 1920,
    gridGap: 6,
    frame: { style: 'solid', color: '#ffffff', width: 0.02 },
  },
  {
    id: 'moodboard',
    titleKey: 'template.moodboard',
    gridId: 'moodboard',
    category: 'editorial',
    gridGap: 16,
  },
  {
    id: 'celebration',
    titleKey: 'template.celebration',
    gridId: 'celebration',
    category: 'creative',
    gridGap: 10,
    gridRadius: 500,
  },
]

// Every template must resolve to a real grid layout — guards against a typo'd
// gridId silently rendering an empty board.
export function getTemplateLayout(t: Template) {
  return getGridById(t.gridId)
}
