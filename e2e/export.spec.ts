import { test, expect } from '@playwright/test'

// A tiny 2×2 red PNG as a base64 data URL
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII='

async function createFixture(path: string) {
  const fs = await import('node:fs')
  const { Buffer } = await import('node:buffer')
  fs.writeFileSync(path, Buffer.from(tinyPngBase64, 'base64'))
}

test.describe('export', () => {
  const fixturePath = '/tmp/e2e-fixture.png'

  test.beforeAll(async () => {
    await createFixture(fixturePath)
  })

  test('export PNG after adding a photo', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await page.locator('#empty-gallery-input').setInputFiles(fixturePath)

    // Wait for photo to appear
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: unknown[] } } }).__editor
        return editor && editor.getState().elements.length > 0
      },
      { timeout: 5000 },
    )

    // Spy download trigger via URL.createObjectURL
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__downloadTriggered = false
      const orig = URL.createObjectURL
      URL.createObjectURL = function (...args: unknown[]) {
        (window as unknown as Record<string, unknown>).__downloadTriggered = true
        return orig.apply(this, args as [Blob | MediaSource])
      }
    })

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()

    const triggered = await page.evaluate(() =>
      (window as unknown as Record<string, unknown>).__downloadTriggered as boolean,
    )
    expect(triggered).toBe(true)
  })

  test('export JPG after adding a photo', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await page.getByLabel('2 Vertical').click()
    await page.locator('#panel-gallery-input').setInputFiles(fixturePath)

    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: unknown[] } } }).__editor
        return editor && editor.getState().elements.length > 0
      },
      { timeout: 5000 },
    )

    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__downloadTriggered = false
      const orig = URL.createObjectURL
      URL.createObjectURL = function (...args: unknown[]) {
        (window as unknown as Record<string, unknown>).__downloadTriggered = true
        return orig.apply(this, args as [Blob | MediaSource])
      }
    })

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download JPG' }).click()

    const triggered = await page.evaluate(() =>
      (window as unknown as Record<string, unknown>).__downloadTriggered as boolean,
    )
    expect(triggered).toBe(true)
  })
})
