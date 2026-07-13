import { useT } from '../i18n/useLang'
import { m, AnimatePresence } from './motion'
import { BottomSheet } from './BottomSheet'
import type { PanelsApi } from './panels.config'

// ---- Mobile: draggable sheet (overlays canvas) + bottom tab bar ----------
// The sheet and the tab bar are separate so App can place the sheet inside the
// positioned canvas host (it overlays the canvas) while the tab bar sits below.

export function MobileSheet({ panels }: { panels: PanelsApi }) {
  const t = useT()
  const { close, current } = panels
  return (
    <BottomSheet
      open={!!current}
      title={current ? t(current.labelKey) : ''}
      onClose={close}
    >
      {current?.panel}
    </BottomSheet>
  )
}

export function MobileTabBar({ panels }: { panels: PanelsApi }) {
  const t = useT()
  const { tabs, active, select } = panels

  return (
    <nav className="scroll-x z-10 flex items-stretch gap-1 overflow-x-auto border-t border-border bg-surface px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => select(tab.id)}
            aria-label={t(tab.labelKey)}
            className={`relative flex min-w-[4rem] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.7rem] font-medium transition active:scale-95 ${
              isActive ? 'text-accent' : 'text-muted hover:text-text'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                isActive
                  ? 'bg-grad-accent text-white shadow-[var(--shadow-accent)]'
                  : ''
              }`}
            >
              <tab.Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            {t(tab.labelKey)}
          </button>
        )
      })}
    </nav>
  )
}

// ---- Desktop: vertical tool rail + docked side panel ---------------------

export function ToolRail({ panels }: { panels: PanelsApi }) {
  const t = useT()
  const { tabs, active, select } = panels

  return (
    <nav className="flex w-[5.5rem] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface px-2 py-3">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => select(tab.id)}
            aria-label={t(tab.labelKey)}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[0.7rem] font-medium transition active:scale-95 ${
              isActive
                ? 'text-accent'
                : 'text-muted hover:bg-surface-2 hover:text-text'
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isActive
                  ? 'bg-grad-accent text-white shadow-[var(--shadow-accent)]'
                  : ''
              }`}
            >
              <tab.Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            {t(tab.labelKey)}
          </button>
        )
      })}
    </nav>
  )
}

export function SidePanel({ panels }: { panels: PanelsApi }) {
  const t = useT()
  const { current } = panels

  return (
    <aside className="flex w-[21rem] shrink-0 flex-col border-l border-border bg-surface">
      <AnimatePresence mode="wait">
        {current ? (
          <m.div
            key={current.id}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <header className="shrink-0 border-b border-border px-5 py-3.5">
              <h2 className="text-grad-accent text-sm font-bold">
                {t(current.labelKey)}
              </h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {current.panel}
            </div>
          </m.div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
            {t('panel.pickTool')}
          </div>
        )}
      </AnimatePresence>
    </aside>
  )
}
