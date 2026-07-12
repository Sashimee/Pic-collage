import Konva from 'konva'
import type { Filter } from 'konva/lib/Node'
import type { FilterPreset, PhotoFilters } from '../types'

export interface FilterConfig {
  filters: Filter[]
  brightness: number
  contrast: number
  hue: number
  saturation: number
  luminance: number
  blurRadius: number
}

export interface FilterPresetDef {
  id: FilterPreset
  label: string
}

export const FILTER_PRESETS: FilterPresetDef[] = [
  { id: 'none', label: 'Original' },
  { id: 'vivid', label: 'Vivid' },
  { id: 'punch', label: 'Punch' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'fade', label: 'Fade' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'noir', label: 'Noir' },
  { id: 'grayscale', label: 'B&W' },
]

// Translate our high-level PhotoFilters into a concrete Konva filter stack plus
// the numeric attributes each filter reads off the node.
export function computeFilterConfig(f: PhotoFilters): FilterConfig {
  let brightness = f.brightness
  let contrast = f.contrast
  let saturation = f.saturation
  let hue = 0
  const luminance = 0
  const stack: Filter[] = []

  switch (f.preset) {
    case 'grayscale':
      stack.push(Konva.Filters.Grayscale)
      break
    case 'noir':
      stack.push(Konva.Filters.Grayscale)
      contrast += 40
      break
    case 'sepia':
      stack.push(Konva.Filters.Sepia)
      break
    case 'vivid':
      contrast += 18
      saturation += 1.6
      break
    case 'punch':
      contrast += 35
      saturation += 2.4
      break
    case 'warm':
      hue = 18
      saturation += 0.4
      break
    case 'cool':
      hue = -18
      saturation += 0.3
      break
    case 'fade':
      contrast -= 22
      saturation -= 0.7
      brightness += 0.08
      break
    case 'none':
    default:
      break
  }

  // HSL carries hue + saturation; Brighten and Contrast carry the sliders.
  stack.push(Konva.Filters.HSL, Konva.Filters.Brighten, Konva.Filters.Contrast)
  if (f.blur > 0) stack.push(Konva.Filters.Blur)

  return {
    filters: stack,
    brightness,
    contrast,
    hue,
    saturation,
    luminance,
    blurRadius: f.blur,
  }
}
