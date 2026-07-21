import Konva from 'konva'
import type { Filter } from 'konva/lib/Node'
import type { FilterOperation, FilterPreset, PhotoFilters } from '../types'

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

/** Apply a non-destructive filter stack to compute Konva filter config. */
export function computeFilterConfigFromStack(
  stack: FilterOperation[] = [],
): FilterConfig {
  let brightness = 0
  let contrast = 0
  let saturation = 0
  let hue = 0
  const luminance = 0
  let blurRadius = 0
  const filters: Filter[] = []

  for (const op of stack) {
    switch (op.type) {
      case 'brightness':
        brightness += op.value
        break
      case 'contrast':
        contrast += op.value
        break
      case 'saturation':
        saturation += op.value
        break
      case 'hueShift':
        hue += op.value
        break
      case 'exposure':
        brightness += op.value * 0.5
        break
      case 'shadows':
        brightness += op.value * 0.3
        break
      case 'highlights':
        brightness -= op.value * 0.2
        break
      case 'blur':
        blurRadius = Math.max(blurRadius, op.radius)
        break
      case 'vignette':
        // Vignette handled at render layer, not Konva
        break
      case 'preset':
        switch (op.id) {
          case 'grayscale':
            filters.push(Konva.Filters.Grayscale)
            break
          case 'noir':
            filters.push(Konva.Filters.Grayscale)
            contrast += 40
            break
          case 'sepia':
            filters.push(Konva.Filters.Sepia)
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
            hue += 18
            saturation += 0.4
            break
          case 'cool':
            hue += -18
            saturation += 0.3
            break
          case 'fade':
            contrast -= 22
            saturation -= 0.7
            brightness += 0.08
            break
          default:
            break
        }
        break
      default:
        break
    }
  }

  // Always push HSL, Brighten, Contrast
  filters.push(Konva.Filters.HSL, Konva.Filters.Brighten, Konva.Filters.Contrast)
  if (blurRadius > 0) filters.push(Konva.Filters.Blur)

  return {
    filters,
    brightness: clamp(brightness, -1, 1),
    contrast: clamp(contrast, -100, 100),
    hue: clamp(hue, -180, 180),
    saturation: clamp(saturation, -2, 10),
    luminance,
    blurRadius: clamp(blurRadius, 0, 40),
  }
}

/** Backwards-compatible: compute from v1 PhotoFilters. */
export function computeFilterConfig(f: PhotoFilters): FilterConfig {
  // Convert v1 to stack then compute
  const stack: FilterOperation[] = [
    { type: 'brightness', value: f.brightness },
    { type: 'contrast', value: f.contrast },
    { type: 'saturation', value: f.saturation },
    { type: 'preset', id: f.preset },
  ]
  if (f.blur > 0) stack.push({ type: 'blur', radius: f.blur })
  if (f.vignette > 0) stack.push({ type: 'vignette', strength: f.vignette })
  return computeFilterConfigFromStack(stack)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ---- Optional WebGPU backend -----------------------------------------------

import {
  adjustBrightnessContrast,
  adjustBrightnessContrastCanvas,
  isWebGPUAvailable,
} from './webgpuFilters'

export { adjustBrightnessContrastCanvas, isWebGPUAvailable }

/**
 * Apply brightness/contrast via WebGPU when available, returning a processed
 * ImageBitmap. Returns null when WebGPU is unavailable so the caller can fall
 * back to the Konva filter stack.
 */
export async function applyFilterWebGPU(
  image: ImageBitmap,
  brightness: number,
  contrast: number,
): Promise<ImageBitmap | null> {
  if (await isWebGPUAvailable()) {
    return adjustBrightnessContrast(image, brightness, contrast)
  }
  return null
}
