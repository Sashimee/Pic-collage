import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  BackgroundPanel,
  FilterPanel,
  LayoutPanel,
  PhotosPanel,
  StickerPanel,
  TextPanel,
} from './Panels'

interface Tab {
  id: string
  label: string
  icon: string
  panel: ReactNode
}

const TABS: Tab[] = [
  { id: 'photos', label: 'Photos', icon: '🖼️', panel: <PhotosPanel /> },
  { id: 'layout', label: 'Layout', icon: '▦', panel: <LayoutPanel /> },
  { id: 'text', label: 'Text', icon: 'T', panel: <TextPanel /> },
  { id: 'stickers', label: 'Stickers', icon: '😊', panel: <StickerPanel /> },
  { id: 'bg', label: 'Background', icon: '🎨', panel: <BackgroundPanel /> },
  { id: 'filters', label: 'Filters', icon: '✨', panel: <FilterPanel /> },
]

export function Toolbar() {
  const [active, setActive] = useState<string | null>('photos')
  const current = TABS.find((t) => t.id === active)

  return (
    <div className="z-10 border-t border-slate-700 bg-slate-900">
      {current && (
        <div className="max-h-[38vh] overflow-y-auto px-4 py-4">{current.panel}</div>
      )}
      <div className="flex items-stretch justify-between gap-1 px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive((a) => (a === tab.id ? null : tab.id))}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition ${
              active === tab.id
                ? 'bg-slate-800 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
