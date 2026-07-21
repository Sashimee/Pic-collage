import type { ReactNode } from 'react'
import { useContextMenu } from '../hooks/useContextMenu'

export function ContextMenu({ menu }: { menu: ReturnType<typeof useContextMenu>['menu'] }) {
  if (!menu.visible) return null

  return (
    <div
      className="fixed z-[100] min-w-[180px] overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            if (!item.disabled) item.action()
          }}
          disabled={item.disabled}
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
            item.disabled
              ? 'cursor-not-allowed text-muted/50'
              : item.danger
                ? 'text-danger hover:bg-danger/10'
                : 'text-text hover:bg-surface-3'
          }`}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.shortcut && (
            <span className="shrink-0 text-xs text-muted">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  )
}
