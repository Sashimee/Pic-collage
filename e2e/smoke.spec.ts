import { test, expect } from '@playwright/test'
import { openApp, skipGallery, waitForElements } from './helpers'

test.describe('smoke', () => {
  test('app loads and shows the layout gallery', async ({ page }) => {
    await openApp(page)
    await expect(page.getByText('Pic Collage', { exact: true })).toBeVisible()
    await expect(page.getByText('Choose a Layout')).toBeVisible()
    await expect(page.getByText('Pick a structure, then add your photos')).toBeVisible()
  })

  test('can switch language', async ({ page }) => {
    await openApp(page)
    // The flags sit behind a dropdown, so it has to be opened first. The
    // trigger's name is exactly the active language (its aria-label); the menu
    // items carry a flag emoji too, so `exact` tells them apart.
    await page.getByRole('button', { name: 'English', exact: true }).click()
    await page.getByRole('button', { name: /Deutsch/ }).click()
    await expect(page.getByText('Layout wählen')).toBeVisible()

    await page.getByRole('button', { name: 'Deutsch', exact: true }).click()
    await page.getByRole('button', { name: /English/ }).click()
    await expect(page.getByText('Choose a Layout')).toBeVisible()
  })

  test('can add text and see it on canvas', async ({ page }) => {
    await openApp(page)
    await skipGallery(page)
    await page.getByRole('button', { name: 'Text', exact: true }).click()
    await page.getByRole('button', { name: /Add text/ }).click()
    await waitForElements(page, 'text')
  })

  test('export menu opens', async ({ page }) => {
    await openApp(page)
    // Regression guard: the header needs its own stacking context, or this
    // dropdown paints behind the canvas and is invisible on desktop.
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByRole('menuitem', { name: 'Download PNG' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Download JPG' })).toBeVisible()
  })

  test('theme toggle names the mode it switches to', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Night mode' }).click()
    await expect(page.getByRole('button', { name: 'Day mode' })).toBeVisible()
  })
})
