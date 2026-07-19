import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerFilter,
  registerStickerPack,
  getRegisteredFilters,
  getRegisteredStickerPacks,
  getFilterById,
  clearRegistries,
} from './registry'

describe('plugin registry', () => {
  beforeEach(() => {
    clearRegistries()
  })

  it('registers and retrieves filters', () => {
    registerFilter({
      id: 'vivid',
      name: 'Vivid',
      nameDe: 'Kräftig',
      apply: (f) => ({ ...f, saturation: 1.5 }),
    })
    expect(getRegisteredFilters().length).toBe(1)
    expect(getFilterById('vivid')?.name).toBe('Vivid')
  })

  it('registers and retrieves sticker packs', () => {
    registerStickerPack({
      id: 'hearts',
      name: 'Hearts',
      nameDe: 'Herzen',
      emojis: ['❤️', '💙', '💚'],
    })
    expect(getRegisteredStickerPacks().length).toBe(1)
    expect(getRegisteredStickerPacks()[0].emojis).toContain('❤️')
  })

  it('clears all registries', () => {
    registerFilter({ id: 'f1', name: 'F1', nameDe: 'F1', apply: (f) => f })
    registerStickerPack({ id: 's1', name: 'S1', nameDe: 'S1', emojis: [] })
    clearRegistries()
    expect(getRegisteredFilters().length).toBe(0)
    expect(getRegisteredStickerPacks().length).toBe(0)
  })
})
