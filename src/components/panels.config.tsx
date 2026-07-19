import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  Image as ImageIcon,
  LayoutGrid,
  Type,
  Brush,
  Smile,
  Palette,
  Wand2,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import {
  BackgroundPanel,
  DrawPanel,
  FilterPanel,
  LayoutPanel,
  PhotosPanel,
  StickerPanel,
  TextPanel,
} from './Panels'
import { useEditor } from '../store/editorStore'

export interface PanelTab {
  id: string
  labelKey: string
  Icon: ComponentType<LucideProps>
  panel: ReactNode
}

// Single source of truth for the editing panels; consumed by both the mobile
// dock (tab bar + bottom sheet) and the desktop shell (tool rail + side panel).
export const PANEL_TABS: PanelTab[] = [
  { id: 'photos', labelKey: 'tab.photos', Icon: ImageIcon, panel: <PhotosPanel /> },
  { id: 'layout', labelKey: 'tab.layout', Icon: LayoutGrid, panel: <LayoutPanel /> },
  { id: 'text', labelKey: 'tab.text', Icon: Type, panel: <TextPanel /> },
  { id: 'draw', labelKey: 'tab.draw', Icon: Brush, panel: <DrawPanel /> },
  { id: 'stickers', labelKey: 'tab.stickers', Icon: Smile, panel: <StickerPanel /> },
  { id: 'bg', labelKey: 'tab.background', Icon: Palette, panel: <BackgroundPanel /> },
  { id: 'filters', labelKey: 'tab.filters', Icon: Wand2, panel: <FilterPanel /> },
]

// Shared active-tab state + selection logic (arms the brush on the Draw tab,
// returns to select mode otherwise). One instance drives whichever shell is
// mounted for the current breakpoint.
export function usePanels(initial: string | null = 'photos') {
  const [active, setActive] = useState<string | null>(initial)
  const setTool = useEditor((s) => s.setTool)

  const select = (id: string) => {
    setActive((a) => {
      const next = a === id ? null : id
      setTool(next === 'draw' ? 'draw' : 'select')
      return next
    })
  }

  const close = () => {
    setActive(null)
    setTool('select')
  }

  const current = PANEL_TABS.find((tab) => tab.id === active) ?? null
  return { tabs: PANEL_TABS, active, select, close, current }
}

export type PanelsApi = ReturnType<typeof usePanels>
