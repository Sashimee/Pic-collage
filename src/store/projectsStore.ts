import { create } from 'zustand'
import { saveProject, loadProject, deleteProject, listProjects, type Project } from '../services/cloudSync'
import { useEditor, type LoadedDocument } from './editorStore'

export interface ProjectMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface ProjectsState {
  projects: ProjectMeta[]
  activeProjectId: string | null
  isLoading: boolean

  // actions
  loadProjectList: () => Promise<void>
  createProject: (name: string) => Promise<string>
  openProject: (id: string) => Promise<void>
  renameProject: (id: string, name: string) => Promise<void>
  duplicateProject: (id: string) => Promise<string>
  deleteProject: (id: string) => Promise<void>
  saveActiveProject: () => Promise<void>
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function getSnapshot(): LoadedDocument {
  const s = useEditor.getState()
  return {
    boardWidth: s.boardWidth,
    boardHeight: s.boardHeight,
    background: s.background,
    mode: s.mode,
    gridId: s.gridId,
    gridGap: s.gridGap,
    gridRadius: s.gridRadius,
    frame: s.frame,
    elements: s.elements,
  }
}

export const useProjects = create<ProjectsState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,

  loadProjectList: async () => {
    if (typeof indexedDB === 'undefined') return
    set({ isLoading: true })
    try {
      const ids = await listProjects()
      const loaded: ProjectMeta[] = []
      for (const id of ids) {
        const p = await loadProject(id)
        if (p) {
          loaded.push({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })
        }
      }
      loaded.sort((a, b) => b.updatedAt - a.updatedAt)
      set({ projects: loaded, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createProject: async (name) => {
    if (typeof indexedDB === 'undefined') return ''
    const id = uid()
    const now = Date.now()
    const snapshot = getSnapshot()
    const project: Project = {
      id,
      name: name || 'Untitled',
      createdAt: now,
      updatedAt: now,
      data: snapshot,
    }
    await saveProject(project)
    set((state) => ({
      projects: [{ id, name: project.name, createdAt: now, updatedAt: now }, ...state.projects],
      activeProjectId: id,
    }))
    return id
  },

  openProject: async (id) => {
    if (typeof indexedDB === 'undefined') return
    const project = await loadProject(id)
    if (!project || !project.data) return
    useEditor.getState().loadDocument(project.data)
    set({ activeProjectId: id })
  },

  renameProject: async (id, name) => {
    if (typeof indexedDB === 'undefined') return
    const project = await loadProject(id)
    if (!project) return
    project.name = name
    project.updatedAt = Date.now()
    await saveProject(project)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: project.updatedAt } : p
      ),
    }))
  },

  duplicateProject: async (id) => {
    if (typeof indexedDB === 'undefined') return ''
    const project = await loadProject(id)
    if (!project) throw new Error('Project not found')
    const newId = uid()
    const now = Date.now()
    const newProject: Project = {
      id: newId,
      name: project.name + ' (Copy)',
      createdAt: now,
      updatedAt: now,
      data: project.data,
    }
    await saveProject(newProject)
    set((state) => ({
      projects: [
        { id: newId, name: newProject.name, createdAt: now, updatedAt: now },
        ...state.projects,
      ],
    }))
    return newId
  },

  deleteProject: async (id) => {
    if (typeof indexedDB === 'undefined') return
    await deleteProject(id)
    set((state) => {
      const nextProjects = state.projects.filter((p) => p.id !== id)
      const nextActive = state.activeProjectId === id ? null : state.activeProjectId
      return { projects: nextProjects, activeProjectId: nextActive }
    })
  },

  saveActiveProject: async () => {
    if (typeof indexedDB === 'undefined') return
    const { activeProjectId } = get()
    if (!activeProjectId) return
    const project = await loadProject(activeProjectId)
    if (!project) return
    project.data = getSnapshot()
    project.updatedAt = Date.now()
    await saveProject(project)
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === activeProjectId ? { ...p, updatedAt: project.updatedAt } : p
      ),
    }))
  },
}))

// Auto-save: whenever the editor state changes, save to the active project.
// Debounced to avoid hammering IndexedDB during rapid edits.
let saveTimeout: ReturnType<typeof setTimeout> | null = null
useEditor.subscribe(() => {
  if (typeof indexedDB === 'undefined') return
  const { activeProjectId } = useProjects.getState()
  if (!activeProjectId) return
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    useProjects.getState().saveActiveProject().catch(() => {})
  }, 1500)
})
