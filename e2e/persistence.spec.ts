import { test, expect } from '@playwright/test'
import { openApp, pngFile, waitForElements } from './helpers'

/**
 * Photo elements carry their pixels as blob: object URLs — handles into the
 * current document that die on reload. Saved projects and version snapshots
 * stored them verbatim, so reopening either after a restart gave a collage with
 * its photos missing. A reload is the only thing that reproduces this; within a
 * session the stale URLs still resolve and everything looks fine.
 */

/** Photo sources currently in the editor. */
const photoSrcs = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    window
      .__editor!.getState()
      .elements.filter((e) => e.type === 'photo')
      .map((e) => (e as unknown as { src: string }).src),
  )

/** Do the sources actually resolve, or are they dead handles? */
const srcsResolve = async (page: import('@playwright/test').Page) => {
  const srcs = await photoSrcs(page)
  if (!srcs.length) return false
  return page.evaluate(
    (list) =>
      Promise.all(
        list.map((s) =>
          fetch(s)
            .then((r) => r.ok)
            .catch(() => false),
        ),
      ).then((rs) => rs.every(Boolean)),
    srcs,
  )
}

test.describe('photos survive a reload', () => {
  test('the autosaved document keeps its photos', async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await page.waitForTimeout(900) // let the 500ms autosave debounce land

    await page.reload()
    await page.waitForFunction(() => !!window.__editor)
    await waitForElements(page, 'photo')

    expect(await srcsResolve(page)).toBe(true)
  })

  test('a saved project keeps its photos', async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    const projectId = await page.evaluate(() =>
      window.__projects!.getState().createProject('Reload Test'),
    )
    expect(projectId).toBeTruthy()

    await page.reload()
    await page.waitForFunction(() => !!window.__editor)

    await page.evaluate(async (id) => {
      // Clear the canvas first, so a pass cannot come from the autosaved doc.
      window.__editor!.getState().clearAll()
      await window.__projects!.getState().openProject(id)
    }, projectId)

    await waitForElements(page, 'photo')
    expect(await srcsResolve(page)).toBe(true)
  })

  test('a restored version keeps its photos', async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    const projectId = await page.evaluate(() =>
      window.__projects!.getState().createProject('Version Test'),
    )

    await page.reload()
    await page.waitForFunction(() => !!window.__editor)

    const restored = await page.evaluate(async (id) => {
      const vs = window.__versions!.getState()
      const rows = await vs.getSnapshots(id)
      if (!rows.length) return { rows: 0, srcs: [] as string[] }
      const data = await vs.restoreSnapshot(rows[0].id)
      return {
        rows: rows.length,
        srcs: (data?.elements ?? [])
          .filter((e) => e.type === 'photo')
          .map((e) => (e as unknown as { src: string }).src),
      }
    }, projectId)

    // Creating the project wrote a version, and it has the photo in it.
    expect(restored.rows).toBeGreaterThan(0)
    expect(restored.srcs).toHaveLength(1)
    expect(restored.srcs[0]).toMatch(/^blob:/)

    const ok = await page.evaluate(
      (s) => fetch(s).then((r) => r.ok).catch(() => false),
      restored.srcs[0],
    )
    expect(ok).toBe(true)
  })
})
