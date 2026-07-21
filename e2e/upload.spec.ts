import { test, expect } from '@playwright/test'

// A tiny 2×2 red PNG as a base64 data URL
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII='

async function createFixture(path: string) {
  const fs = await import('node:fs')
  const { Buffer } = await import('node:buffer')
  fs.writeFileSync(path, Buffer.from(tinyPngBase64, 'base64'))
}

test.describe('upload', () => {
  const fixturePath = '/tmp/e2e-fixture.png'

  test.beforeAll(async () => {
    await createFixture(fixturePath)
  })

  test('upload photo via empty state gallery input', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await expect(page.getByText('Create your collage')).toBeVisible()

    const input = page.locator('#empty-gallery-input')
    await input.setInputFiles(fixturePath)

    // Wait for importFiles to process and state to update
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: unknown[] } } }).__editor
        return editor && editor.getState().elements.length > 0
      },
      { timeout: 5000 }
    )

    // Empty state should be gone now that there are elements
    await expect(page.getByText('Create your collage')).not.toBeVisible()
  })

  test('upload multiple photos via panel gallery input', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    // Dismiss empty state by choosing a template
    await page.getByLabel('4 Grid').click()

    // Open Photos tab (desktop tool rail button)
    await page.getByRole('button', { name: 'Photos', exact: true }).click()
    const input = page.locator('#panel-gallery-input')
    await input.setInputFiles([fixturePath, fixturePath])

    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: unknown[] } } }).__editor
        return editor && editor.getState().elements.length >= 2
      },
      { timeout: 5000 }
    )
  })
})
