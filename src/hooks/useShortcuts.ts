import { useEffect, useRef } from 'react'
import { useEditor } from '../store/editorStore'

export interface ShortcutCallbacks {
  onExport?: () => void
  onSave?: () => void
  onOpenProject?: () => void
}

export function useShortcuts(callbacks: ShortcutCallbacks = {}) {
  const cbRef = useRef(callbacks)
  cbRef.current = callbacks

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      const key = e.key.toLowerCase()

      // Undo
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useEditor.getState().undo()
        return
      }

      // Redo
      if (mod && e.shiftKey && key === 'z') {
        e.preventDefault()
        useEditor.getState().redo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        useEditor.getState().redo()
        return
      }

      // Select all (top-most element)
      if (mod && key === 'a') {
        e.preventDefault()
        const els = useEditor.getState().elements
        if (els.length) {
          const top = els[els.length - 1]
          useEditor.getState().select(top.id)
        }
        return
      }

      // Delete / Backspace
      if (key === 'delete' || key === 'backspace') {
        const selectedId = useEditor.getState().selectedId
        if (selectedId) {
          e.preventDefault()
          useEditor.getState().removeElement(selectedId)
        }
        return
      }

      // Save
      if (mod && key === 's') {
        e.preventDefault()
        cbRef.current.onSave?.()
        return
      }

      // Export
      if (mod && key === 'e') {
        e.preventDefault()
        cbRef.current.onExport?.()
        return
      }

      // Open project
      if (mod && key === 'o') {
        e.preventDefault()
        cbRef.current.onOpenProject?.()
        return
      }

      // Escape deselect
      if (key === 'escape') {
        e.preventDefault()
        useEditor.getState().select(null)
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
