import { useEffect } from 'react'
import { useToasts } from './ToastContainer'
import { useT } from '../i18n/useLang'
import { claimFirstUse } from '../lib/firstUse'
import { DEMOS, type DemoId } from './GestureDemo'

/**
 * Show a gesture demo the first time a panel that needs one is opened.
 *
 * Not every tool earns a tutorial. Buttons explain themselves; gestures do not,
 * so this covers only the four that nothing on screen can hint at — dragging a
 * divider, pinching to zoom, panning a photo inside its cell, and dragging a
 * layer past another.
 *
 * It rides the toast host, which is already `pointer-events-none` with each
 * card claiming pointers back. That is what keeps the board usable while a
 * demo plays, which for a gesture tip is the whole point: you should be able to
 * copy it as you watch.
 */
export interface Tip {
  /** First-use id — shared registry, so `openApp` can suppress them all. */
  id: string
  demo: DemoId
  /** Existing translation key; these tips reuse copy rather than adding it. */
  messageKey: string
}

/** Panel id → the tip it earns. Panels not listed here get none. */
export const PANEL_TIPS: Record<string, Tip> = {
  layers: { id: 'layers', demo: 'reorder', messageKey: 'layer.reorder' },
  layout: { id: 'cellZoom', demo: 'cellPan', messageKey: 'tips.cellPan' },
}

export function useTipToast() {
  const toast = useToasts()
  const t = useT()

  return (tip: Tip) => {
    // Claims as it asks, so StrictMode's double-invoked effects show one tip.
    if (!claimFirstUse(tip.id)) return
    const Demo = DEMOS[tip.demo]
    toast.rich(
      <span className="flex items-center gap-2.5">
        <span className="h-9 w-9 shrink-0 text-text/70" data-gesture-demo={tip.id}>
          <Demo />
        </span>
        <span>{t(tip.messageKey)}</span>
      </span>,
      7000,
    )
  }
}

/** Fire a tip when `active` becomes a panel that has one. */
export function usePanelTips(active: string | null) {
  const show = useTipToast()
  useEffect(() => {
    if (!active) return
    const tip = PANEL_TIPS[active]
    if (tip) show(tip)
    // `show` is rebuilt each render; the effect must key on the panel alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
