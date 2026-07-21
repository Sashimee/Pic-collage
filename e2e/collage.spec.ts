import { test, expect } from '@playwright/test'

// A tiny 2×2 red PNG as a base64 data URL
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII='

async function createFixture(path: string) {
  const fs = await import('node:fs')
  const { Buffer } = await import('node:buffer')
  fs.writeFileSync(path, Buffer.from(tinyPngBase64, 'base64'))
}

test.describe('collage end-to-end', () => {
  const fixturePath = '/tmp/e2e-fixture.png'

  test.beforeAll(async () => {
    await createFixture(fixturePath)
  })

  test('open app → upload photo → add text → export PNG', async ({ page }) => {
    // Dismiss onboarding overlay by seeding localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })

    await page.goto('/')

    // 1. App loads
    await expect(page.getByText('Create your collage')).toBeVisible()

    // 2. Upload a photo via empty-state gallery input
    const input = page.locator('#empty-gallery-input')
    await input.setInputFiles(fixturePath)

    // 3. Verify canvas has a photo element via editor state
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: { type: string }[] } } }).__editor
        return editor?.getState().elements.some((el) => el.type === 'photo')
      },
      { timeout: 5000 },
    )

    // Empty state should be gone
    await expect(page.getByText('Create your collage')).not.toBeVisible()

    // 4. Add text
    await page.getByLabel('Text').click()
    await page.getByRole('button', { name: 'Add text' }).click()

    // 5. Verify text appears in editor state
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: { type: string }[] } } }).__editor
        return editor?.getState().elements.some((el) => el.type === 'text')
      },
      { timeout: 5000 },
    )

    // 6. Export PNG and verify download triggered
    await page.getByRole('button', { name: 'Export' }).click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/collage-.*\.png/)
  })
})
