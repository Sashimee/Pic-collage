import { test, expect } from '@playwright/test'
import {
  downloadTriggered,
  openApp,
  pngFile,
  spyDownloads,
  waitForElements,
} from './helpers'

test.describe('collage end-to-end', () => {
  test('open app → add photo → add text → export PNG', async ({ page }) => {
    await openApp(page)
    await expect(page.getByText('Choose a Layout')).toBeVisible()

    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await expect(page.getByText('Choose a Layout')).toBeHidden()

    await page.getByRole('button', { name: 'Text', exact: true }).click()
    await page.getByRole('button', { name: /Add text/ }).click()
    await waitForElements(page, 'text')

    await spyDownloads(page)
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()
    await expect.poll(() => downloadTriggered(page)).toBe(true)
  })
})
