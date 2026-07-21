import { useEffect } from 'react'
import { useEditor } from '../store/editorStore'
import { useToast } from '../store/toastStore'
import type { CanvasElement } from '../types'

interface ClipboardEntry {
  elements: CanvasElement[]
  boardWidth: number
  boardHeight: number
}

let clipboard: ClipboardEntry | null = null

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function deepCloneElement(el: CanvasElement): CanvasElement {
  const base = { ...el, id: uid() }
  if (el.type === 'photo') {
    return { ...base, filters: { ...el.filters } } as CanvasElement
  }
  if (el.type === 'text') {
    return { ...base, chip: el.chip ? { ...el.chip } : undefined } as CanvasElement
  }
  return base
}

export function copyToClipboard(elements: CanvasElement[], boardWidth: number, boardHeight: number) {
  clipboard = {
    elements: elements.map(deepCloneElement),
    boardWidth,
    boardHeight,
  }
}

export function getClipboard(): ClipboardEntry | null {
  return clipboard
}

export function hasClipboard(): boolean {
  return !!clipboard
}

export async function copyImageToSystemClipboard(dataUrl: string) {
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ])
    return true
  } catch {
    return false
  }
}

export function useClipboard() {
  const addToast = useToast((s) => s.add)
  const elements = useEditor((s) => s.elements)
  const selectedId = useEditor((s) => s.selectedId)
  const multiSelected = useEditor((s) => s.multiSelected)
  const boardWidth = useEditor((s) => s.boardWidth)
  const boardHeight = useEditor((s) => s.boardHeight)
  const setElements = useEditor((s) => s.setElements)

  const handleCopy = () => {
    const ids = multiSelected.length ? multiSelected : selectedId ? [selectedId] : []
    if (!ids.length) return
    const toCopy = elements.filter((e) => ids.includes(e.id))
    if (!toCopy.length) return
    copyToClipboard(toCopy, boardWidth, boardHeight)
    addToast('Copied to clipboard', 'success')
  }

  const handlePaste = () => {
    const data = getClipboard()
    if (!data) return
    const offsetX = 40
    const offsetY = 40
    const pasted = data.elements.map((el) => {
      const cloned = deepCloneElement(el)
      cloned.x += offsetX
      cloned.y += offsetY
      return cloned
    })
    setElements([...elements, ...pasted])
    addToast('Pasted from clipboard', 'success')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        handleCopy()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        handlePaste()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, multiSelected, elements, boardWidth, boardHeight])

  return { handleCopy, handlePaste }
}
