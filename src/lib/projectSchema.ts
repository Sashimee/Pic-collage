import type { LoadedDocument } from '../store/editorStore'

/*
 * A project used to hold exactly one collage: `Project.data` was a bare
 * LoadedDocument. Photo books need several, so the stored shape is now a list
 * of pages with a cursor.
 *
 * `Project.data` is typed `any` in the storage layer and every project already
 * saved on a user's device is in the old shape, so everything reads through
 * `toProjectDocument()`, which migrates on the way in. Nothing rewrites stored
 * records eagerly — a project is upgraded the next time it is saved.
 */

export const PROJECT_SCHEMA = 2

export interface ProjectDocument {
  schema: typeof PROJECT_SCHEMA
  pages: LoadedDocument[]
  /** Index into `pages`; always in range for a value returned by this module. */
  activePage: number
}

function isDocument(v: unknown): v is LoadedDocument {
  // Board size and an element list are the two things every page must have;
  // the rest have defaults applied by loadDocument.
  if (!v || typeof v !== 'object') return false
  const d = v as Partial<LoadedDocument>
  return (
    typeof d.boardWidth === 'number' &&
    typeof d.boardHeight === 'number' &&
    Array.isArray(d.elements)
  )
}

/** Wrap a single collage as a one-page project. */
export function singlePage(doc: LoadedDocument): ProjectDocument {
  return { schema: PROJECT_SCHEMA, pages: [doc], activePage: 0 }
}

/**
 * Normalise whatever came out of storage into a ProjectDocument.
 *
 * Returns `null` only when there is genuinely nothing usable — callers treat
 * that as "leave the editor alone" rather than clearing the user's canvas.
 * Anything salvageable is salvaged: a legacy bare document becomes page one,
 * and an out-of-range or missing cursor is clamped rather than rejected.
 */
export function toProjectDocument(data: unknown): ProjectDocument | null {
  if (!data || typeof data !== 'object') return null

  const d = data as Partial<ProjectDocument>

  if (Array.isArray(d.pages)) {
    const pages = d.pages.filter(isDocument)
    if (!pages.length) return null
    const raw = typeof d.activePage === 'number' ? d.activePage : 0
    return {
      schema: PROJECT_SCHEMA,
      pages,
      activePage: Math.max(0, Math.min(pages.length - 1, Math.floor(raw))),
    }
  }

  // Legacy: `data` *is* the document.
  return isDocument(data) ? singlePage(data) : null
}

/** The page the editor should be showing. */
export function activeDocument(doc: ProjectDocument): LoadedDocument {
  return doc.pages[doc.activePage]
}

/** Replace the active page, leaving the rest of the project untouched. */
export function withActivePage(
  doc: ProjectDocument,
  page: LoadedDocument,
): ProjectDocument {
  const pages = doc.pages.slice()
  pages[doc.activePage] = page
  return { ...doc, pages }
}
