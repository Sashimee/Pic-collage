import { test, expect } from '@playwright/test'
import { openApp, pngFile, waitForElements } from './helpers'

/**
 * A tester cancelled a share and got an iOS "open in Preview" sheet for a file
 * they had just declined to send. Cause: shareDataURL collapsed every failure
 * into `false`, so "user tapped cancel" was indistinguishable from "this
 * browser cannot share" — and the caller's download fallback ran.
 */

/** Install a fake Web Share API before the app decides whether to show Share. */
async function stubShare(
  page: import('@playwright/test').Page,
  behaviour: 'resolve' | 'abort',
) {
  await page.addInitScript((mode) => {
    const w = window as unknown as {
      __shareCalls: number
      __downloads: number
      __sharedNames: string[]
    }
    w.__shareCalls = 0
    w.__downloads = 0
    // The stub used to ignore `data.files` entirely, which is why nothing
    // noticed that a multi-page project shared exactly one image.
    w.__sharedNames = []

    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data?: { files?: File[] }) => {
        w.__shareCalls++
        w.__sharedNames = (data?.files ?? []).map((f) => f.name)
        return mode === 'abort'
          ? Promise.reject(new DOMException('Share canceled', 'AbortError'))
          : Promise.resolve()
      },
    })

    // Count real downloads only. Importing a photo also mints an image object
    // URL, so counting those would fire on every upload; a download is
    // specifically an anchor carrying a `download` attribute being clicked.
    const click = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute('download')) {
        w.__downloads++
        return // don't actually save anything during the test
      }
      return click.call(this)
    }
  }, behaviour)
}

const counters = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const w = window as unknown as {
      __shareCalls: number
      __downloads: number
      __sharedNames: string[]
    }
    return { shares: w.__shareCalls, downloads: w.__downloads, names: w.__sharedNames }
  })

/** The action button inside a toast, scoped away from the header's own Save. */
const toastAction = (page: import('@playwright/test').Page) =>
  page.getByRole('status').getByRole('button', { name: 'Save', exact: true })

async function shareFromMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Export' }).click()
  await page.getByRole('menuitem', { name: 'Share…' }).click()
}

test.describe('sharing', () => {
  test('cancelling leaves no file behind', async ({ page }) => {
    await stubShare(page, 'abort')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await shareFromMenu(page)
    await expect.poll(async () => (await counters(page)).shares).toBe(1)

    // Give a stray download every chance to appear before declaring success.
    await page.waitForTimeout(500)
    expect((await counters(page)).downloads).toBe(0)
    // ...and no rescue toast either: there is nothing to rescue.
    await expect(toastAction(page)).toHaveCount(0)
  })

  test('a successful share offers a way to keep the picture', async ({ page }) => {
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await shareFromMenu(page)
    await expect.poll(async () => (await counters(page)).shares).toBe(1)

    // Facebook accepts the intent and drops the file, so a resolved share is no
    // proof of delivery — but it must not download behind the user's back.
    expect((await counters(page)).downloads).toBe(0)
    await expect(toastAction(page)).toBeVisible()
  })

  test('sharing saves the work first', async ({ page }) => {
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await shareFromMenu(page)
    await expect
      .poll(() =>
        page.evaluate(() => {
          const w = window as unknown as { __shareCalls: number }
          return w.__shareCalls
        }),
      )
      .toBe(1)

    // A project now exists even though the user never created one explicitly,
    // so leaving for another app cannot lose the collage.
    await expect
      .poll(() => page.evaluate(() => indexedDB.databases().then((d) => d.map((x) => x.name))))
      .toContain('pic-collage-db')
  })

  test('a multi-page project shares every page, not just the active one', async ({ page }) => {
    // The reported bug: with several pages, sharing to Facebook sent only the
    // page on screen. `ensureProjectSaved()` already refreshed the page list
    // right before the share; nothing read it.
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await page.getByRole('button', { name: 'Add page' }).click()
    await expect(page.locator('[data-page-tile]')).toHaveCount(2)
    await page.getByRole('button', { name: 'Photos', exact: true }).click()
    await page.locator('#panel-gallery-input').setInputFiles(pngFile('second.png'))
    await waitForElements(page, 'photo')
    await page.getByRole('button', { name: 'Photos', exact: true }).click()

    await shareFromMenu(page)

    await expect.poll(async () => (await counters(page)).shares, { timeout: 60_000 }).toBe(1)
    const { names, downloads } = await counters(page)
    expect(names).toEqual(['collage-1.jpg', 'collage-2.jpg'])
    expect(downloads).toBe(0)
  })

  test('"share this page" still sends exactly one', async ({ page }) => {
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await page.getByRole('button', { name: 'Add page' }).click()
    await expect(page.locator('[data-page-tile]')).toHaveCount(2)

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Share this page only' }).click()

    await expect.poll(async () => (await counters(page)).shares, { timeout: 30_000 }).toBe(1)
    // One page keeps the name it has always had.
    expect((await counters(page)).names).toEqual(['collage.jpg'])
  })

  test('the single-page share is unchanged', async ({ page }) => {
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await shareFromMenu(page)

    await expect.poll(async () => (await counters(page)).shares, { timeout: 30_000 }).toBe(1)
    expect((await counters(page)).names).toEqual(['collage.jpg'])
  })

  test('the board keeps its photos after a multi-page share', async ({ page }) => {
    // The off-screen renderer hydrates each page and releases what it minted.
    // Releasing the editor's own URLs instead would blank the board.
    await stubShare(page, 'resolve')
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await page.getByRole('button', { name: 'Add page' }).click()
    await expect(page.locator('[data-page-tile]')).toHaveCount(2)

    await shareFromMenu(page)
    await expect.poll(async () => (await counters(page)).shares, { timeout: 60_000 }).toBe(1)

    const ok = await page.evaluate(async () => {
      const srcs = window
        .__editor!.getState()
        .elements.filter((e) => e.type === 'photo')
        .map((e) => (e as unknown as { src: string }).src)
      const results = await Promise.all(
        srcs.map((s) => fetch(s).then((r) => r.ok).catch(() => false)),
      )
      return results.every(Boolean)
    })
    expect(ok).toBe(true)
  })
})
