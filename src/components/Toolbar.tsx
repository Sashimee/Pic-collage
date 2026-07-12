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
    <div className="z-10 border-t border-border bg-surface">
      {current && (
        <div className="max-h-[40vh] overflow-y-auto border-b border-border/60 px-4 py-4">
          {current.panel}
        </div>
      )}
      <div className="scroll-x flex items-stretch gap-1 overflow-x-auto px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex min-w-[4rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.7rem] font-medium transition active:scale-95 ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none transition ${
                  isActive ? 'bg-accent text-accent-fg shadow-sm shadow-accent/30' : ''
                }`}
              >
                {tab.icon}
              </span>
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
