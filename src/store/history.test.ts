import { describe, it, expect, beforeEach } from 'vitest'
import { history, AddPhotoCommand, RemoveElementCommand } from './history'
import { useEditor } from './editorStore'

beforeEach(() => {
  // reset the editor store to a clean state before each test
  useEditor.getState().clearAll?.()
})

describe('history command layer', () => {
  it('undo/redo add photo', () => {
    const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0AAf8AAAAASUVORK5CYII='
    const cmd = new AddPhotoCommand(src, 100, 100)
    history.exec(cmd)
    let state = useEditor.getState()
    expect(state.elements).toHaveLength(1)
    const id = state.elements[0].id
    // undo
    history.undo()
    state = useEditor.getState()
    expect(state.elements).toHaveLength(0)
    // redo
    history.redo()
    state = useEditor.getState()
    expect(state.elements).toHaveLength(1)
    expect(state.elements[0].id).toBe(id)
  })

  it('undo remove element', () => {
    const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0AAf8AAAAASUVORK5CYII='
    const add = new AddPhotoCommand(src, 100, 100)
    history.exec(add)
    let state = useEditor.getState()
    const id = state.elements[0].id
    const rem = new RemoveElementCommand(id)
    history.exec(rem)
    state = useEditor.getState()
    expect(state.elements).toHaveLength(0)
    // undo removal should restore element
    history.undo()
    state = useEditor.getState()
    expect(state.elements).toHaveLength(1)
    expect(state.elements[0].id).toBe(id)
  })
})
