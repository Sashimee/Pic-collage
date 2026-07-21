import { useEffect, useCallback } from 'react'
import { useEditor } from '../store/editorStore'
import { useToast } from '../store/toastStore'

export type ShortcutMap = Record<string, () => void>

/**
 * Global keyboard shortcut manager.
 * Maps key combos (e.g. "ctrl+z", "delete", "ctrl+shift+d") to actions.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const addToast = useToast((s) => s.add)

  const handler = useCallback(
    (e: KeyboardEvent) => {
      const mods: string[] = []
      if (e.ctrlKey || e.metaKey) mods.push('ctrl')
      if (e.altKey) mods.push('alt')
      if (e.shiftKey) mods.push('shift')
      const key = e.key.toLowerCase()
      const combo = [...mods, key].join('+')

      // Prevent default for known shortcuts
      if (combo in shortcuts) {
        e.preventDefault()
        try {
          shortcuts[combo]()
        } catch (err) {
          addToast('Shortcut failed: ' + String(err), 'error')
        }
      }
    },
    [shortcuts, addToast],
  )

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}

/** Default shortcuts for the Pic-Collage editor. */
export function useDefaultShortcuts() {
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redo)
  const clearAll = useEditor((s) => s.clearAll)
  const duplicateElement = useEditor((s) => s.duplicateElement)
  const removeElement = useEditor((s) => s.removeElement)
  const selected = useEditor((s) => s.selected?.())
  const select = useEditor((s) => s.select)
  const bringToFront = useEditor((s) => s.bringToFront)
  const sendToBack = useEditor((s) => s.sendToBack)
  const bringForward = useEditor((s) => s.bringForward)
  const sendBackward = useEditor((s) => s.sendBackward)

  const shortcuts: ShortcutMap = {
    'ctrl+z': undo,
    'ctrl+shift+z': redo,
    'ctrl+y': redo,
    'ctrl+d': () => {
      if (selected) duplicateElement(selected.id)
    },
    'delete': () => {
      if (selected) removeElement(selected.id)
    },
    'ctrl+shift+d': () => {
      if (selected) duplicateElement(selected.id)
    },
    'escape': () => select(null),
    'ctrl+shift+[': () => {
      if (selected) sendToBack(selected.id)
    },
    'ctrl+shift+]': () => {
      if (selected) bringToFront(selected.id)
    },
    'ctrl+[': () => {
      if (selected) sendBackward(selected.id)
    },
    'ctrl+]': () => {
      if (selected) bringForward(selected.id)
    },
    'ctrl+shift+c': () => {
      if (window.confirm('Clear the whole canvas?')) {
        clearAll()
      }
    },
  }

  useKeyboardShortcuts(shortcuts)
}
