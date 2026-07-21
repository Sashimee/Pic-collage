import { lazy, Suspense } from 'react'
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
import { useEditor } from '../store/editorStore'

// Lazy-load panels to reduce initial bundle
const PhotosPanel = lazy(() => import('./Panels').then((m) => ({ default: m.PhotosPanel })))
const LayoutPanel = lazy(() => import('./Panels').then((m) => ({ default: m.LayoutPanel })))
const TextPanel = lazy(() => import('./Panels').then((m) => ({ default: m.TextPanel })))
const DrawPanel = lazy(() => import('./Panels').then((m) => ({ default: m.DrawPanel })))
const StickerPanel = lazy(() => import('./Panels').then((m) => ({ default: m.StickerPanel })))
const BackgroundPanel = lazy(() => import('./Panels').then((m) => ({ default: m.BackgroundPanel })))
const FilterPanel = lazy(() => import('./Panels').then((m) => ({ default: m.FilterPanel })))

function PanelFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export interface PanelTab {
  id: string
  labelKey: string
  Icon: ComponentType<LucideProps>
  panel: ReactNode
}

export const PANEL_TABS: PanelTab[] = [
  { id: 'photos', labelKey: 'tab.photos', Icon: ImageIcon, panel: <Suspense fallback={<PanelFallback />}><PhotosPanel /></Suspense> },
  { id: 'layout', labelKey: 'tab.layout', Icon: LayoutGrid, panel: <Suspense fallback={<PanelFallback />}><LayoutPanel /></Suspense> },
  { id: 'text', labelKey: 'tab.text', Icon: Type, panel: <Suspense fallback={<PanelFallback />}><TextPanel /></Suspense> },
  { id: 'draw', labelKey: 'tab.draw', Icon: Brush, panel: <Suspense fallback={<PanelFallback />}><DrawPanel /></Suspense> },
  { id: 'stickers', labelKey: 'tab.stickers', Icon: Smile, panel: <Suspense fallback={<PanelFallback />}><StickerPanel /></Suspense> },
  { id: 'bg', labelKey: 'tab.background', Icon: Palette, panel: <Suspense fallback={<PanelFallback />}><BackgroundPanel /></Suspense> },
  { id: 'filters', labelKey: 'tab.filters', Icon: Wand2, panel: <Suspense fallback={<PanelFallback />}><FilterPanel /></Suspense> },
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
