import { describe, it, expect } from 'vitest'
import { computeFilterConfigFromStack, computeFilterConfig } from '../filters'
import Konva from 'konva'
import type { FilterOperation } from '../../types'

describe('computeFilterConfigFromStack', () => {
  it('returns defaults for empty stack', () => {
    const cfg = computeFilterConfigFromStack([])
    expect(cfg.filters).toContain(Konva.Filters.HSL)
    expect(cfg.filters).toContain(Konva.Filters.Brighten)
    expect(cfg.filters).toContain(Konva.Filters.Contrast)
    expect(cfg.brightness).toBe(0)
    expect(cfg.contrast).toBe(0)
    expect(cfg.hue).toBe(0)
    expect(cfg.saturation).toBe(0)
    expect(cfg.blurRadius).toBe(0)
  })

  it('accumulates brightness', () => {
    const stack: FilterOperation[] = [
      { type: 'brightness', value: 0.3 },
      { type: 'brightness', value: 0.2 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.brightness).toBeCloseTo(0.5)
  })

  it('accumulates contrast', () => {
    const stack: FilterOperation[] = [
      { type: 'contrast', value: 20 },
      { type: 'contrast', value: 15 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.contrast).toBe(35)
  })

  it('applies saturation', () => {
    const stack: FilterOperation[] = [
      { type: 'saturation', value: 2 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.saturation).toBe(2)
  })

  it('adds a channel-shift filter for temperature and warms pixels', () => {
    const base = computeFilterConfigFromStack([])
    const cfg = computeFilterConfigFromStack([{ type: 'temperature', value: 50 }])
    // temperature pushes an extra custom filter beyond the always-on HSL/Brighten/Contrast
    expect(cfg.filters.length).toBe(base.filters.length + 1)
    const shift = cfg.filters.find(
      (f) => f !== Konva.Filters.HSL && f !== Konva.Filters.Brighten && f !== Konva.Filters.Contrast,
    )!
    const data = new Uint8ClampedArray([100, 100, 100, 255])
    // @ts-expect-error minimal ImageData stand-in for the custom filter
    shift({ data })
    expect(data[0]).toBeGreaterThan(100) // red lifted (warmer)
    expect(data[2]).toBeLessThan(100) // blue reduced
  })

  it('does not add a channel-shift filter when temperature/tint are zero', () => {
    const cfg = computeFilterConfigFromStack([{ type: 'temperature', value: 0 }])
    expect(cfg.filters).toHaveLength(3) // HSL, Brighten, Contrast only
  })

  it('applies hueShift', () => {
    const stack: FilterOperation[] = [
      { type: 'hueShift', value: 45 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.hue).toBe(45)
  })

  it('applies blur and includes Konva blur filter', () => {
    const stack: FilterOperation[] = [
      { type: 'blur', radius: 5 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.blurRadius).toBe(5)
    expect(cfg.filters).toContain(Konva.Filters.Blur)
  })

  it('uses max blur when multiple blur ops are present', () => {
    const stack: FilterOperation[] = [
      { type: 'blur', radius: 3 },
      { type: 'blur', radius: 8 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.blurRadius).toBe(8)
  })

  it('applies grayscale preset', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'grayscale' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.filters).toContain(Konva.Filters.Grayscale)
  })

  it('applies sepia preset', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'sepia' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.filters).toContain(Konva.Filters.Sepia)
  })

  it('applies noir preset (grayscale + contrast boost)', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'noir' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.filters).toContain(Konva.Filters.Grayscale)
    expect(cfg.contrast).toBe(40)
  })

  it('applies vivid preset (contrast + saturation)', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'vivid' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.contrast).toBe(18)
    expect(cfg.saturation).toBe(1.6)
  })

  it('applies punch preset', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'punch' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.contrast).toBe(35)
    expect(cfg.saturation).toBe(2.4)
  })

  it('applies warm preset (hue + saturation)', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'warm' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.hue).toBe(18)
    expect(cfg.saturation).toBe(0.4)
  })

  it('applies cool preset', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'cool' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.hue).toBe(-18)
    expect(cfg.saturation).toBe(0.3)
  })

  it('applies fade preset', () => {
    const stack: FilterOperation[] = [
      { type: 'preset', id: 'fade' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.contrast).toBe(-22)
    expect(cfg.saturation).toBe(-0.7)
    expect(cfg.brightness).toBeCloseTo(0.08)
  })

  it('combines multiple operations', () => {
    const stack: FilterOperation[] = [
      { type: 'brightness', value: 0.1 },
      { type: 'contrast', value: 10 },
      { type: 'saturation', value: 1 },
      { type: 'preset', id: 'vivid' },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.brightness).toBeCloseTo(0.1)
    expect(cfg.contrast).toBe(28)
    expect(cfg.saturation).toBe(2.6)
  })

  it('clamps values to allowed ranges', () => {
    const stack: FilterOperation[] = [
      { type: 'brightness', value: 5 },
      { type: 'contrast', value: 500 },
      { type: 'saturation', value: 100 },
      { type: 'hueShift', value: 999 },
      { type: 'blur', radius: 100 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.brightness).toBe(1)
    expect(cfg.contrast).toBe(100)
    expect(cfg.saturation).toBe(10)
    expect(cfg.hue).toBe(180)
    expect(cfg.blurRadius).toBe(40)
  })

  it('ignores vignette (handled at render layer)', () => {
    const stack: FilterOperation[] = [
      { type: 'vignette', strength: 0.5 },
    ]
    const cfg = computeFilterConfigFromStack(stack)
    expect(cfg.filters).not.toContain(Konva.Filters.Blur)
  })
})

describe('computeFilterConfig (v1 backward-compat)', () => {
  it('maps v1 PhotoFilters to a stack', () => {
    const cfg = computeFilterConfig({
      brightness: 0.2,
      contrast: 15,
      saturation: 1.2,
      blur: 4,
      vignette: 0.3,
      preset: 'sepia',
    })
    expect(cfg.brightness).toBeCloseTo(0.2)
    expect(cfg.contrast).toBe(15)
    expect(cfg.saturation).toBe(1.2)
    expect(cfg.blurRadius).toBe(4)
    expect(cfg.filters).toContain(Konva.Filters.Sepia)
  })
})
