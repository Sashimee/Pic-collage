import { useState } from 'react'
import type { ReactNode } from 'react'
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
import { useT } from '../i18n/useLang'

interface Tab {
  id: string
  labelKey: string
  icon: string
  panel: ReactNode
}

const TABS: Tab[] = [
  { id: 'photos', labelKey: 'tab.photos', icon: '🖼️', panel: <PhotosPanel /> },
  { id: 'layout', labelKey: 'tab.layout', icon: '📐', panel: <LayoutPanel /> },
  { id: 'text', labelKey: 'tab.text', icon: '✏️', panel: <TextPanel /> },
  { id: 'draw', labelKey: 'tab.draw', icon: '🖌️', panel: <DrawPanel /> },
  { id: 'stickers', labelKey: 'tab.stickers', icon: '😊', panel: <StickerPanel /> },
  { id: 'bg', labelKey: 'tab.background', icon: '🎨', panel: <BackgroundPanel /> },
  { id: 'filters', labelKey: 'tab.filters', icon: '✨', panel: <FilterPanel /> },
]

export function Toolbar() {
  const [active, setActive] = useState<string | null>('photos')
  const t = useT()
  const setTool = useEditor((s) => s.setTool)
  const current = TABS.find((tab) => tab.id === active)

  // Selecting the Draw tab arms the brush; leaving it returns to select mode.
  const selectTab = (id: string) => {
    setActive((a) => {
      const next = a === id ? null : id
      setTool(next === 'draw' ? 'draw' : 'select')
      return next
    })
  }

  return (
    <div className="z-10 border-t border-slate-700 bg-slate-900">
      {current && (
        <div className="max-h-[38vh] overflow-y-auto px-4 py-4">{current.panel}</div>
      )}
      <div className="flex items-stretch justify-between gap-1 px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition active:opacity-70 ${
              active === tab.id
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
