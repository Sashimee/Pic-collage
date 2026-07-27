import { test, expect } from '@playwright/test'
import {
  downloadTriggered,
  openApp,
  pngFile,
  skipGallery,
  spyDownloads,
  waitForElements,
} from './helpers'

test.describe('export', () => {
  test('export PNG after adding a photo', async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await spyDownloads(page)
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()

    await expect.poll(() => downloadTriggered(page)).toBe(true)
  })

  test('export JPG after adding a photo', async ({ page }) => {
    await openApp(page)
    await skipGallery(page)
    await page.getByRole('button', { name: 'Photos', exact: true }).click()
    await page.locator('#panel-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await spyDownloads(page)
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download JPG' }).click()

    await expect.poll(() => downloadTriggered(page)).toBe(true)
  })

  test('export SVG after adding a photo', async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')

    await spyDownloads(page)
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: /SVG/i }).click()

    await expect.poll(() => downloadTriggered(page)).toBe(true)
  })
})
