// src/store/history.ts
// Simple command‑pattern layer for the editor store.
// Provides undo/redo functionality without interfering with the store's internal history.

import { useEditor } from './editorStore'

// -------------------------------------------------------------------
// Command interface
// -------------------------------------------------------------------
export interface Command {
  /** Execute the command – mutates the editor store */
  do(): void
  /** Undo the command – reverts the store back to the previous state */
  undo(): void
}

// -------------------------------------------------------------------
// Concrete command implementations
// -------------------------------------------------------------------
export class AddPhotoCommand implements Command {
  private element: any = null
  constructor(
    private src: string,
    private naturalWidth: number,
    private naturalHeight: number,
  ) {}
  do() {
    const store = useEditor.getState()
    if (this.element) {
      // redo – re‑insert the stored element
      const newEls = [...store.elements, this.element]
      ;(store as any).elements = newEls
      ;(store as any).selectedId = this.element.id
    } else {
      store.addPhoto(this.src, this.naturalWidth, this.naturalHeight)
      const newState = useEditor.getState()
      this.element = { ...newState.elements[newState.elements.length - 1] }
    }
  }
  undo() {
    if (!this.element) return
    const store = useEditor.getState()
    const newEls = store.elements.filter((e) => e.id !== this.element.id)
    ;(store as any).elements = newEls
    ;(store as any).selectedId = null
  }
}

export class RemoveElementCommand implements Command {
  private snapshot: any = null
  constructor(private id: string) {}
  do() {
    const store = useEditor.getState()
    // Save the element for undo before removal
    this.snapshot = store.elements.find((e) => e.id === this.id)
    if (this.snapshot) {
      console.log('len before removal', store.elements.length)
      // Use the store's built‑in removal method so all side‑effects (recording, URL revocation) run
      store.removeElement(this.id)
      console.log('len after removal', useEditor.getState().elements.length)
    }
  }
  undo() {
    if (!this.snapshot) return
    // Re‑insert the element at its original position (sorted by id for determinism)
    useEditor.setState((s) => {
      const idx = s.elements.findIndex((e) => e.id > this.snapshot.id)
      const newEls = [...s.elements]
      if (idx === -1) newEls.push(this.snapshot)
      else newEls.splice(idx, 0, this.snapshot)
      return { ...s, elements: newEls, selectedId: this.snapshot.id }
    })
  }
}

// -------------------------------------------------------------------
// History manager – holds the command stacks
// -------------------------------------------------------------------
export class History {
  private undoStack: Command[] = []
  private redoStack: Command[] = []

  exec(cmd: Command) {
    cmd.do()
    this.undoStack.push(cmd)
    this.redoStack = []
  }

  undo() {
    const cmd = this.undoStack.pop()
    if (!cmd) return
    cmd.undo()
    this.redoStack.push(cmd)
  }

  redo() {
    const cmd = this.redoStack.pop()
    if (!cmd) return
    cmd.do()
    this.undoStack.push(cmd)
  }

  getUndoCount() { return this.undoStack.length }
  getRedoCount() { return this.redoStack.length }
}

export const history = new History()
