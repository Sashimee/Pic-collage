import { createRoot, type Root } from 'react-dom/client'
import { Layer, Stage } from 'react-konva'
import type Konva from 'konva'
import { BoardScene } from '../components/BoardScene'
import { useEditor, type LoadedDocument } from '../store/editorStore'
import { rehydratePhotos } from './photoRehydrate'
import { assignSlots, resolveLayoutById } from './grids'
import { containRect } from './photoBook'
import type { PhotoElement } from '../types'

/**
 * Render pages that are not the one being edited.
 *
 * The app has exactly one Konva stage — the live board — and `exportBoard`
 * snapshots it. A photo book needs every page, so this mounts a second stage
 * off-screen and draws each page through `BoardScene`, the same component the
 * editor uses. Nothing here touches the live document: no page switching, no
 * writes to IndexedDB, no undo history cleared.
 *
 * Pages are rendered one at a time on purpose. `rehydratePhotos` mints three
 * object URLs per photo and an A4 page at 300 DPI is a ~35 MB canvas, so
 * holding a whole book at once is how this becomes a crash on a phone.
 */

/** Two rAFs: one for React to commit, one for Konva to redraw. */
const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

/** How many bitmaps this page will draw once everything has decoded. */
function expectedImageCount(doc: LoadedDocument): number {
  const photos = doc.elements.filter(
    (e): e is PhotoElement => e.type === 'photo' && !e.hidden,
  )
  const layout = doc.gridId ? resolveLayoutById(doc.gridId) : undefined
  const inGrid = doc.mode === 'grid' && !!layout
  const content = inGrid
    ? assignSlots(layout.cells.length, photos).filter(Boolean).length
    : photos.length
  const background =
    doc.background.type === 'photo' && doc.background.photoSrc ? 1 : 0
  return content + background
}

/**
 * Wait until the bitmaps are actually on the nodes.
 *
 * `useImage` decodes asynchronously and hands the image over a render later, so
 * a snapshot taken too early is silently blank or half-drawn — the same failure
 * that made watermarked exports come out empty. Polling the nodes is stronger
 * than preloading the URLs: it checks what will really be drawn, including grid
 * cells, which do not render a node at all until their image is ready.
 */
async function waitForImages(stage: Konva.Stage, expected: number, timeoutMs = 15_000) {
  if (expected === 0) return
  const started = Date.now()
  for (;;) {
    const ready = stage.find('Image').filter((n) => !!(n as Konva.Image).image()).length
    if (ready >= expected) return
    if (Date.now() - started > timeoutMs) return // a missing blob must not hang the export
    await nextFrame()
  }
}

/** Object URLs minted for one page, so they can be released again. */
function revokePageUrls(elements: LoadedDocument['elements']) {
  for (const el of elements) {
    if (el.type !== 'photo') continue
    for (const url of [el.src, el.previewSrc, el.originalSrc, el.thumbSrc]) {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }
}

export interface RenderPagesOptions {
  /** Output bitmap size, in pixels — the sheet at print resolution. */
  width: number
  height: number
  format?: 'jpeg' | 'png'
  quality?: number
  onProgress?: (done: number, total: number) => void
  /** Set `cancelled` to stop after the page in flight. */
  signal?: { cancelled: boolean }
}

export async function renderPages(
  pages: LoadedDocument[],
  options: RenderPagesOptions,
): Promise<string[]> {
  const { width, height, format = 'jpeg', quality = 0.92, onProgress, signal } = options
  if (!pages.length) return []

  const host = document.createElement('div')
  // Off-screen rather than display:none — Konva draws to its own canvas either
  // way, but a laid-out container keeps measurement behaviour predictable.
  host.style.cssText =
    'position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none'
  document.body.appendChild(host)

  const stageRef: { current: Konva.Stage | null } = { current: null }
  let root: Root | null = null
  const out: string[] = []

  // Full-resolution photo sources, set once for the whole run rather than per
  // page — it is read through a React selector, so each flip costs a render.
  const wasExporting = useEditor.getState().exporting
  useEditor.getState().setExporting(true)

  try {
    root = createRoot(host)
    for (let i = 0; i < pages.length; i++) {
      if (signal?.cancelled) break
      const page = pages[i]
      const elements = await rehydratePhotos(page.elements)
      const doc: LoadedDocument = { ...page, elements }

      // Fit the board onto the sheet the same way the PDF will, so what is
      // rendered is what gets printed rather than something stretched.
      const box = containRect(doc.boardWidth, doc.boardHeight, width, height)
      const scale = box.width / doc.boardWidth

      root.render(
        <Stage ref={stageRef} width={width} height={height}>
          <Layer>
            <BoardScene doc={doc} />
          </Layer>
        </Stage>,
      )

      await nextFrame()
      const stage = stageRef.current
      if (!stage) break
      // The board group is positioned by the stage rather than by BoardScene,
      // which draws in board units from the origin.
      stage.scale({ x: scale, y: scale })
      stage.position({ x: box.x, y: box.y })

      await waitForImages(stage, expectedImageCount(doc))
      await nextFrame()

      out.push(
        stage.toDataURL({
          mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
          quality,
          pixelRatio: 1,
        }),
      )

      // Release this page before touching the next one.
      revokePageUrls(elements)
      onProgress?.(i + 1, pages.length)
    }
  } finally {
    useEditor.getState().setExporting(wasExporting)
    root?.unmount()
    host.remove()
  }

  return out
}
