import { test, expect } from '@playwright/test'
import { openApp, pngFile, settleCanvas, waitForElements } from './helpers'

const PHONE = { width: 390, height: 844 }

/** The mobile panel sheet, identified by its drag handle's rounded container. */
const sheet = (page: import('@playwright/test').Page) =>
  page.locator('div.absolute.inset-x-0.bottom-0.z-30')

test.describe('panel sheet vs. canvas', () => {
  test.use({ viewport: PHONE })

  test.beforeEach(async ({ page }) => {
    await openApp(page)
    // Load through the start screen's own input: it dismisses the layout
    // gallery as a side effect, leaving a free canvas with one photo.
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await expect(page.getByText('Choose a Layout')).toBeHidden()
  })

  test('the board clears an open panel instead of hiding behind it', async ({ page }) => {
    // Reported by a tester: with a photo at the bottom of the collage you could
    // not apply a filter to it, because the filter sheet covered it. The sheet
    // has no scrim by design — the canvas stays interactive — so the fix is for
    // the board to be fitted above it.
    await settleCanvas(page)
    const before = await page.evaluate(() => window.__boardRect!())

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    await expect(sheet(page)).toBeVisible()
    await settleCanvas(page)

    const after = await page.evaluate(() => window.__boardRect!())
    const sheetTop = (await sheet(page).boundingBox())!.y

    expect(after.y + after.height).toBeLessThanOrEqual(sheetTop + 1)
    // It had to shrink to get there — otherwise the assertion above could pass
    // simply because the board was small to begin with.
    expect(after.height).toBeLessThan(before.height)
  })

  test('closing the panel gives the board its space back', async ({ page }) => {
    await settleCanvas(page)
    const before = await page.evaluate(() => window.__boardRect!())

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    await expect(sheet(page)).toBeVisible()
    await settleCanvas(page)

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    await expect(sheet(page)).toBeHidden()
    await settleCanvas(page)

    const after = await page.evaluate(() => window.__boardRect!())
    expect(after.height).toBeCloseTo(before.height, 0)
  })
})
