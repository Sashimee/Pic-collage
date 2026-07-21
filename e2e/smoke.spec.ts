import { test, expect } from '@playwright/test'

test.describe('smoke', () => {
  test('app loads and shows title', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await expect(page.getByText('Pic Collage')).toBeVisible()
    await expect(page.getByText('Create your collage')).toBeVisible()
  })

  test('can switch language', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await page.getByLabel('Deutsch').click()
    await expect(page.getByText('Erstelle deine Collage')).toBeVisible()
    await page.getByLabel('English').click()
    await expect(page.getByText('Create your collage')).toBeVisible()
  })

  test('can add text and see it on canvas', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    // Dismiss empty state by picking a template
    await page.getByLabel('2 Vertical').click()
    // Open text tab and click Add text
    await page.getByLabel('Text').click()
    await page.getByRole('button', { name: 'Add text' }).click()
    // Verify via editor state that a text element was added
    await page.waitForFunction(
      () => {
        const editor = (window as unknown as { __editor?: { getState: () => { elements: { type: string }[] } } }).__editor
        return editor?.getState().elements.some((el) => el.type === 'text')
      },
      { timeout: 5000 },
    )
  })

  test('export menu opens', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pic-collage-onboarded-v2', '1')
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByRole('menuitem', { name: 'Download PNG' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Download JPG' })).toBeVisible()
  })
})
