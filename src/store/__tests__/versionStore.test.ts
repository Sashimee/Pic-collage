import { describe, it, expect, beforeEach } from 'vitest'
import { useVersionStore, MAX_SNAPSHOTS } from '../versionStore'
import { useProjects, defaultProjectName } from '../projectsStore'
import { useEditor } from '../editorStore'
import type { Background, CanvasElement } from '../../types'

/** The editor's own default, rather than a second copy that could drift. */
const bg = (): Background => structuredClone(useEditor.getState().background)

const text = (id: string): CanvasElement => ({
  id,
  type: 'text',
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  text: id,
  fontFamily: 'sans-serif',
  fontSize: 48,
  fill: '#000',
  fontStyle: 'normal',
})

beforeEach(() => {
  useEditor.setState({ elements: [], selectedId: null, past: [], future: [] })
  useProjects.setState({ projects: [], activeProjectId: null, isLoading: false })
})

describe('saveSnapshot', () => {
  it('records a version that the history panel can then read', async () => {
    // Regression: versionStore had saveSnapshot and startAutoSave, and nothing
    // in the app called either — so Version History was permanently empty.
    const store = useVersionStore.getState()
    await store.saveSnapshot('p1', [text('a')], bg())

    const rows = await store.getSnapshots('p1')
    expect(rows).toHaveLength(1)
    expect(rows[0].elementCount).toBe(1)
  })

  it('does not record a second entry when nothing changed', async () => {
    // The autosave fires on a 1.5s debounce; without this every pause during
    // ordinary editing would bury the versions that mean something.
    const store = useVersionStore.getState()
    const els = [text('a')]
    await store.saveSnapshot('p2', els, bg())
    await store.saveSnapshot('p2', els, bg())

    expect(await store.getSnapshots('p2')).toHaveLength(1)
  })

  it('records again once the document actually changes', async () => {
    const store = useVersionStore.getState()
    await store.saveSnapshot('p3', [text('a')], bg())
    await store.saveSnapshot('p3', [text('a'), text('b')], bg())

    const rows = await store.getSnapshots('p3')
    expect(rows).toHaveLength(2)
    expect(rows[0].elementCount).toBe(2) // newest first
  })

  it('notices a background-only change', async () => {
    const store = useVersionStore.getState()
    const els = [text('a')]
    await store.saveSnapshot('p4', els, bg())
    await store.saveSnapshot('p4', els, { ...bg(), color: '#ff0000' })

    expect(await store.getSnapshots('p4')).toHaveLength(2)
  })

  it('keeps history bounded — snapshots inline their photos', async () => {
    const store = useVersionStore.getState()
    for (let i = 0; i < MAX_SNAPSHOTS + 5; i++) {
      await store.saveSnapshot('p5', Array.from({ length: i + 1 }, (_, n) => text(`e${n}`)), bg())
    }
    const rows = await store.getSnapshots('p5')
    expect(rows).toHaveLength(MAX_SNAPSHOTS)
    // The survivors are the newest ones.
    expect(rows[0].elementCount).toBe(MAX_SNAPSHOTS + 5)
  })

  it('keeps projects' + "'" + ' histories apart', async () => {
    const store = useVersionStore.getState()
    await store.saveSnapshot('a', [text('x')], bg())
    await store.saveSnapshot('b', [text('y')], bg())

    expect(await store.getSnapshots('a')).toHaveLength(1)
    expect(await store.getSnapshots('b')).toHaveLength(1)
  })

  it('round-trips a snapshot through restore', async () => {
    const store = useVersionStore.getState()
    await store.saveSnapshot('p6', [text('keep-me')], bg())
    const [row] = await store.getSnapshots('p6')

    const restored = await store.restoreSnapshot(row.id)
    expect(restored?.elements).toHaveLength(1)
    expect((restored!.elements[0] as { text: string }).text).toBe('keep-me')
  })
})

describe('project saves feed version history', () => {
  it('creating a project writes its first version', async () => {
    useEditor.getState().addText()
    const id = await useProjects.getState().createProject('Test')

    expect(await useVersionStore.getState().getSnapshots(id)).toHaveLength(1)
  })

  it('saving after an edit adds a version', async () => {
    useEditor.getState().addText()
    const id = await useProjects.getState().createProject('Test')

    useEditor.getState().addText()
    await useProjects.getState().saveActiveProject()

    expect(await useVersionStore.getState().getSnapshots(id)).toHaveLength(2)
  })

  it('saving with no edit does not', async () => {
    useEditor.getState().addText()
    const id = await useProjects.getState().createProject('Test')
    await useProjects.getState().saveActiveProject()

    expect(await useVersionStore.getState().getSnapshots(id)).toHaveLength(1)
  })
})

describe('defaultProjectName', () => {
  it('names an implicitly created project after its date', () => {
    const name = defaultProjectName(new Date('2026-07-28T10:00:00Z'))
    expect(name).toMatch(/^Collage /)
    expect(name.length).toBeGreaterThan('Collage '.length)
  })
})
