import { describe, it, expect, beforeEach } from 'vitest'
import { useEditor } from '../editorStore'
import type { PhotoElement, TextElement } from '../../types'

function resetStore() {
  const s = useEditor.getState()
  s.clearAll()
  useEditor.setState({ past: [], future: [] })
}

describe('editorStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('addPhoto', () => {
    it('adds a photo element centred on the board', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      const state = useEditor.getState()
      expect(state.elements).toHaveLength(1)
      const photo = state.elements[0] as PhotoElement
      expect(photo.type).toBe('photo')
      expect(photo.src).toBe('blob:fake')
      expect(photo.x).toBeGreaterThan(0)
      expect(photo.y).toBeGreaterThan(0)
      expect(state.selectedId).toBe(photo.id)
    })

    it('keeps photo within board bounds', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      const photo = useEditor.getState().elements[0] as PhotoElement
      const { boardWidth, boardHeight } = useEditor.getState()
      expect(photo.x + photo.width).toBeLessThanOrEqual(boardWidth + 1)
      expect(photo.y + photo.height).toBeLessThanOrEqual(boardHeight + 1)
    })
  })

  describe('removeElement', () => {
    it('removes an element and clears selection', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      const id = useEditor.getState().elements[0].id
      s.removeElement(id)
      const state = useEditor.getState()
      expect(state.elements).toHaveLength(0)
      expect(state.selectedId).toBeNull()
    })

    it('records history before removal', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      expect(useEditor.getState().past.length).toBeGreaterThan(0)
      const id = useEditor.getState().elements[0].id
      s.removeElement(id)
      expect(useEditor.getState().past.length).toBeGreaterThan(1)
    })
  })

  describe('duplicateElement', () => {
    it('creates a copy offset by 40px', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      const orig = useEditor.getState().elements[0] as PhotoElement
      s.duplicateElement(orig.id)
      const state = useEditor.getState()
      expect(state.elements).toHaveLength(2)
      const copy = state.elements[1] as PhotoElement
      expect(copy.id).not.toBe(orig.id)
      expect(copy.x).toBe(orig.x + 40)
      expect(copy.y).toBe(orig.y + 40)
      expect(copy.src).toBe(orig.src)
    })

    it('selects the duplicated element', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      const orig = useEditor.getState().elements[0]
      s.duplicateElement(orig.id)
      const state = useEditor.getState()
      expect(state.selectedId).toBe(state.elements[1].id)
    })
  })

  describe('undo / redo', () => {
    it('undo restores previous state after addPhoto', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      expect(useEditor.getState().elements).toHaveLength(1)
      s.undo()
      const state = useEditor.getState()
      expect(state.elements).toHaveLength(0)
    })

    it('redo restores undone state', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      s.undo()
      expect(useEditor.getState().elements).toHaveLength(0)
      s.redo()
      expect(useEditor.getState().elements).toHaveLength(1)
    })

    it('clears future on new action', () => {
      const s = useEditor.getState()
      s.addPhoto('blob:fake', 800, 600)
      s.addText()
      s.undo()
      expect(useEditor.getState().future.length).toBe(1)
      s.addPhoto('blob:fake2', 400, 300)
      expect(useEditor.getState().future.length).toBe(0)
    })

    it('undo is a no-op when past is empty', () => {
      const state = useEditor.getState()
      state.undo()
      expect(useEditor.getState().elements).toHaveLength(0)
    })

    it('redo is a no-op when future is empty', () => {
      const state = useEditor.getState()
      state.redo()
      expect(useEditor.getState().elements).toHaveLength(0)
    })
  })

  describe('addText', () => {
    it('adds a text element and selects it', () => {
      const s = useEditor.getState()
      s.addText()
      const state = useEditor.getState()
      expect(state.elements).toHaveLength(1)
      const text = state.elements[0] as TextElement
      expect(text.type).toBe('text')
      expect(text.text).toBe('Tap to edit')
      expect(state.selectedId).toBe(text.id)
    })
  })
})
