import { test, expect } from '@playwright/test'
import { openApp } from './helpers'

/**
 * Add-to-home-screen. Three browsers, three behaviours:
 * a real one-tap install where `beforeinstallprompt` fires, illustrated steps
 * on iOS where the API doesn't exist, and nothing at all on Firefox where
 * there's no install route to point at.
 */

/** Fire a stand-in for the real event, which Playwright's Chromium won't emit. */
const fireInstallPrompt = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const evt = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: () => {
        ;(window as unknown as Record<string, unknown>).__installPrompted = true
        return Promise.resolve()
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    window.dispatchEvent(evt)
  })

test.describe('install', () => {
  test('offers a one-tap install once the browser allows it', async ({ page }) => {
    await openApp(page)
    await fireInstallPrompt(page)

    await page.getByRole('button', { name: 'Install app' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Keep it on your home screen')).toBeVisible()

    // The real install button, not instructions.
    await page.getByRole('dialog').getByRole('button', { name: 'Install app' }).click()
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as Record<string, unknown>).__installPrompted),
      )
      .toBe(true)
  })

  test('shows Add to Home Screen steps on iOS instead of a button', async ({ browser }) => {
    const ctx = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await ctx.newPage()
    await openApp(page)

    // Mobile puts it behind the ☰ menu.
    await page.getByRole('button', { name: /more|menu/i }).first().click()
    await page.getByRole('button', { name: 'Install app' }).click()

    await expect(page.getByText('Tap the Share button')).toBeVisible()
    await expect(page.getByText('Choose “Add to Home Screen”')).toBeVisible()
    // No install button can exist on iOS — only the steps.
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Install app' }),
    ).toHaveCount(0)
    await ctx.close()
  })

  test('shows no entry point at all on Firefox', async ({ browser }) => {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:127.0) Gecko/20100101 Firefox/127.0',
    })
    const page = await ctx.newPage()
    await openApp(page)
    await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0)
    await ctx.close()
  })

  test('hides the entry point once running from the home screen', async ({ browser }) => {
    const ctx = await browser.newContext()
    // Report standalone before the app's module-level detection runs.
    await ctx.addInitScript(() => {
      const orig = window.matchMedia.bind(window)
      window.matchMedia = (q: string) =>
        q.includes('standalone')
          ? ({
              matches: true,
              media: q,
              addEventListener: () => {},
              removeEventListener: () => {},
            } as unknown as MediaQueryList)
          : orig(q)
    })
    const page = await ctx.newPage()
    await openApp(page)
    await expect(page.getByRole('button', { name: 'Install app' })).toHaveCount(0)
    await ctx.close()
  })
})
