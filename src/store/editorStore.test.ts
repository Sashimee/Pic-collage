import { describe, it, expect } from 'vitest'
import { useEditor } from './editorStore'

describe('editorStore basic actions', () => {
  it('adds and removes a photo element', () => {
    // add a photo (placeholder data URL)
    useEditor.getState().addPhoto('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0AAf8AAAAASUVORK5CYII=', 100, 100)
    let state = useEditor.getState()
    expect(state.elements).toHaveLength(1)
    const photoId = state.elements[0].id
    state.removeElement(photoId)
    state = useEditor.getState()
    expect(state.elements).toHaveLength(0)
  })

  it('reorders z-order correctly', () => {
    const store = useEditor.getState()
    // three photos
    store.addPhoto('data:1', 100, 100)
    store.addPhoto('data:2', 100, 100)
    store.addPhoto('data:3', 100, 100)
    const ids = useEditor.getState().elements.map(e => e.id)
    // bring first to front
    useEditor.getState().bringToFront(ids[0])
    const newOrder = useEditor.getState().elements.map(e => e.id)
    // after bringing to front, the element should be last in array
    expect(newOrder[2]).toBe(ids[0])
  })
})
