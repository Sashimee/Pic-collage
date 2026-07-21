import { test, expect } from '@playwright/test'

test.describe('layout-first onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
  })

  test('app loads and shows LayoutGallery on empty canvas', async ({ page }) => {
    await expect(page.getByText('Choose a Layout')).toBeVisible()
    await expect(page.getByText('Pick a structure, then add your photos')).toBeVisible()
  })

  test('tapping a layout opens the Photo Assignment Sheet', async ({ page }) => {
    // Find first layout button (aria-label contains "photos")
    const layoutBtn = page.locator('[aria-label*="photos"]').first()
    await layoutBtn.click()
    await expect(page.getByText('Add Photos')).toBeVisible()
    await expect(page.getByText('Tap a slot to add a photo')).toBeVisible()
  })

  test('skipping assignment enters grid mode with empty placeholders', async ({ page }) => {
    const layoutBtn = page.locator('[aria-label*="photos"]').first()
    await layoutBtn.click()
    await page.getByRole('button', { name: /Skip for now/i }).click()
    // After skip, grid mode should be active: empty placeholders visible as dashed rects
    // We verify via the editor store state that mode === 'grid'
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { mode: string } } }).__editor
        return editor?.getState().mode === 'grid'
      },
      { timeout: 5000 },
    )
  })

  test('assigning a photo to a cell shows the photo in the grid', async ({ page }) => {
    const layoutBtn = page.locator('[aria-label*="photos"]').first()
    await layoutBtn.click()

    // Tap first slot to trigger file picker
    const slot = page.locator('button', { hasText: /Slot 1/i }).first()
    await slot.click()

    // Simulate file upload via hidden input
    const fileInput = page.locator('input[type="file"]').first()
    // Create a tiny 1x1 red PNG in memory via data transfer
    // Playwright can set files directly on the input element
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    await fileInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer })

    // Photo should now appear in slot thumbnail
    await expect(page.locator('img[alt="Slot 1"]')).toBeVisible()

    // Click Done to assign
    await page.getByRole('button', { name: /Done/i }).click()

    // Verify editor has a photo element
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: { type: string }[] } } }).__editor
        return editor?.getState().elements.some((el) => el.type === 'photo')
      },
      { timeout: 5000 },
    )
  })
})
