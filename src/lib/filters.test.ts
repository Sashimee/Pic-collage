import { computeFilterConfig } from './filters'
import { expect, test } from 'vitest'
import type { PhotoFilters } from '../types'

const baseFilters: PhotoFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 1,
  blur: 0,
  vignette: 0,
  preset: 'none',
}

test('grayscale preset adds Grayscale filter', () => {
  const cfg = computeFilterConfig({ ...baseFilters, preset: 'grayscale' })
  // Konva.Filters.Grayscale is a function; compare by name property
  const hasGrayscale = cfg.filters.some(f => (f as any).name === 'Grayscale')
  expect(hasGrayscale).toBe(true)
})
