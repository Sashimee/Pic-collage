import type { GridCell } from '../types'
import type { DividerLine } from './customLayout'

const STORAGE_KEY = 'pic-collage-custom-layouts-v1'
const MAX_LAYOUTS = 50

export interface SavedCustomLayout {
  id: string
  name: string
  createdAt: number
  cells: GridCell[]
  lines: DividerLine[]
}

function readStore(): SavedCustomLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function writeStore(layouts: SavedCustomLayout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts.slice(-MAX_LAYOUTS)))
}

export function saveCustomLayout(layout: SavedCustomLayout) {
  const layouts = readStore()
  const idx = layouts.findIndex((l) => l.id === layout.id)
  if (idx >= 0) {
    layouts[idx] = layout
  } else {
    layouts.push(layout)
  }
  writeStore(layouts)
}

export function loadCustomLayouts(): SavedCustomLayout[] {
  return readStore()
}

export function deleteCustomLayout(id: string) {
  const layouts = readStore().filter((l) => l.id !== id)
  writeStore(layouts)
}

export function getCustomLayoutById(id: string): SavedCustomLayout | undefined {
  return readStore().find((l) => l.id === id)
}
