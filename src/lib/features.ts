// Simple runtime feature-flag system: URL params override localStorage.
// Use for gradually rolling out or hiding experimental features.

export type FeatureFlag = 'drawing' | 'templates' | 'opacityBlend'

const DEFAULTS: Record<FeatureFlag, boolean> = {
  drawing: true,
  templates: true,
  opacityBlend: true,
}

export function isEnabled(flag: FeatureFlag): boolean {
  // URL param wins
  const params = new URLSearchParams(window.location.search)
  const param = params.get(flag)
  if (param === '1' || param === 'true') return true
  if (param === '0' || param === 'false') return false

  // Then localStorage
  const stored = localStorage.getItem(`feat_${flag}`)
  if (stored !== null) return stored === '1'

  // Default
  return DEFAULTS[flag]
}

export function setEnabled(flag: FeatureFlag, value: boolean): void {
  localStorage.setItem(`feat_${flag}`, value ? '1' : '0')
}
