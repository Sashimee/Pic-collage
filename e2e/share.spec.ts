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
    const w = window as unknown as { __shareCalls: number; __downloads: number }
    w.__shareCalls = 0
    w.__downloads = 0

    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => {
        w.__shareCalls++
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
    const w = window as unknown as { __shareCalls: number; __downloads: number }
    return { shares: w.__shareCalls, downloads: w.__downloads }
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
})
