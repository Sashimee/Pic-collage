import { test, expect } from '@playwright/test'
import { countElements, openApp, pngFile, skipGallery, waitForElements } from './helpers'

test.describe('upload', () => {
  test('upload photo via the start screen gallery input', async ({ page }) => {
    await openApp(page)
    await expect(page.getByText('Choose a Layout')).toBeVisible()

    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    // The start screen only covers an empty canvas.
    await expect(page.getByText('Choose a Layout')).toBeHidden()
  })

  test('upload multiple photos via the Photos panel', async ({ page }) => {
    await openApp(page)
    await skipGallery(page)

    await page.getByRole('button', { name: 'Photos', exact: true }).click()
    await page.locator('#panel-gallery-input').setInputFiles([pngFile('a.png'), pngFile('b.png')])

    await waitForElements(page, 'photo', 2)
    expect(await countElements(page, 'photo')).toBe(2)
  })
})
