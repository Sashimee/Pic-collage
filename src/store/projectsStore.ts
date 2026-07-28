import { create } from 'zustand'
import { saveProject, loadProject, deleteProject, listProjects, type Project } from '../services/cloudSync'
import { useEditor, type LoadedDocument } from './editorStore'
import { useVersionStore } from './versionStore'
import { rehydratePhotos, stripPhotoUrls } from '../lib/photoRehydrate'
import {
  activeDocument,
  singlePage,
  toProjectDocument,
  withActivePage,
} from '../lib/projectSchema'

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

/**
 * Name for a project created implicitly (e.g. saving before a share), where
 * prompting would put a dialog in the user's way. Follows the UI language via
 * the browser's locale rather than hard-coding English.
 */
export function defaultProjectName(now = new Date()): string {
  return `Collage ${now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
}

/**
 * Record a version-history entry alongside the project save. `versionStore`
 * has always had the machinery for this, but nothing ever called it — which is
 * why the History panel was permanently empty. It de-duplicates and prunes
 * internally, so callers can fire it on every save.
 */
async function recordVersion(projectId: string) {
  const s = useEditor.getState()
  await useVersionStore.getState().saveSnapshot(projectId, s.elements, s.background)
}

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
    // Photos' object URLs are per-document and die on reload; keep only the
    // photoId so openProject can rebuild them from IndexedDB.
    elements: stripPhotoUrls(s.elements),
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
    const snapshot = singlePage(getSnapshot())
    const project: Project = {
      id,
      name: name || 'Untitled',
      createdAt: now,
      updatedAt: now,
      data: snapshot,
    }
    await saveProject(project)
    await recordVersion(id)
    set((state) => ({
      projects: [{ id, name: project.name, createdAt: now, updatedAt: now }, ...state.projects],
      activeProjectId: id,
    }))
    return id
  },

  openProject: async (id) => {
    if (typeof indexedDB === 'undefined') return
    const project = await loadProject(id)
    if (!project) return
    // Migrates a legacy single-document project into a one-page one; returns
    // null only when there is nothing usable, in which case leave the canvas
    // as it is rather than clearing the user's work.
    const doc = toProjectDocument(project.data)
    if (!doc) return
    const page = activeDocument(doc)
    const elements = await rehydratePhotos(page.elements)
    useEditor.getState().loadDocument({ ...page, elements })
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
    // Keep any other pages; only the one being edited is replaced.
    const existing = toProjectDocument(project.data)
    project.data = existing
      ? withActivePage(existing, getSnapshot())
      : singlePage(getSnapshot())
    project.updatedAt = Date.now()
    await saveProject(project)
    await recordVersion(activeProjectId)
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

// Dev-only test seam, alongside `window.__editor` in editorStore. Lets the e2e
// suite drive project save/open across a page reload, which is the only way to
// exercise photo rehydration — within a session the stale URLs still resolve.
if (import.meta.env.DEV) {
  ;(window as unknown as { __projects?: typeof useProjects }).__projects = useProjects
}
