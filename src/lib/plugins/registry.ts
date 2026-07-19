import type { FilterPlugin, StickerPackPlugin } from './types'

const filterRegistry = new Map<string, FilterPlugin>()
const stickerRegistry = new Map<string, StickerPackPlugin>()

export function registerFilter(plugin: FilterPlugin) {
  filterRegistry.set(plugin.id, plugin)
}

export function registerStickerPack(pack: StickerPackPlugin) {
  stickerRegistry.set(pack.id, pack)
}

export function getRegisteredFilters(): FilterPlugin[] {
  return Array.from(filterRegistry.values())
}

export function getRegisteredStickerPacks(): StickerPackPlugin[] {
  return Array.from(stickerRegistry.values())
}

export function getFilterById(id: string): FilterPlugin | undefined {
  return filterRegistry.get(id)
}

export function getStickerPackById(id: string): StickerPackPlugin | undefined {
  return stickerRegistry.get(id)
}

export function clearRegistries() {
  filterRegistry.clear()
  stickerRegistry.clear()
}
