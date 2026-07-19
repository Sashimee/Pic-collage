import type { PhotoFilters } from '../../types'

export interface FilterPlugin {
  id: string
  name: string
  nameDe: string
  apply: (filters: PhotoFilters) => Partial<PhotoFilters>
}

export interface StickerPackPlugin {
  id: string
  name: string
  nameDe: string
  emojis: string[]
}
