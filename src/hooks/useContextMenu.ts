import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
  visible: boolean
}

export interface ContextMenuItem {
  label: string
  icon?: ReactNode
  shortcut?: string
  action: () => void
  disabled?: boolean
  danger?: boolean
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, items: [], visible: false })

  const show = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    setMenu({ x, y, items, visible: true })
  }, [])

  const hide = useCallback(() => {
    setMenu((m) => ({ ...m, visible: false }))
  }, [])

  useEffect(() => {
    const onClick = () => hide()
    const onScroll = () => hide()
    window.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
    }
  }, [hide])

  return { menu, show, hide }
}
