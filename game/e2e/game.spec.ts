import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const PLAY = /Jouer|Play|Spielen|Jugar|Gioca|Jogar/

/** Shots remaining, read off the HUD's accessible label ("3 / 5"). */
async function shotsLeft(page: Page): Promise<number> {
  const label = await page.getByTestId('shots').getAttribute('aria-label')
  return Number(label?.split('/')[0].trim())
}

/**
 * Flicks towards the goal and waits for the shot to be judged.
 *
 * A flick that lands while the previous ball is still in play is ignored by
 * design, so this retries until the HUD actually ticks down rather than
 * sleeping for a guessed interval.
 */
async function takeShot(page: Page, dx: number, dy: number) {
  const before = await shotsLeft(page)

  await expect
    .poll(
      async () => {
        await page.mouse.move(195, 700)
        await page.mouse.down()
        for (let i = 1; i <= 6; i++) {
          await page.mouse.move(195 + (dx * i) / 6, 700 - (dy * i) / 6)
        }
        await page.mouse.up()
        // Slightly longer than a full shot cycle (flight + celebration),
        // so the first attempt normally lands instead of re-flicking.
        await page.waitForTimeout(3200)
        return await shotsLeft(page)
      },
      { timeout: 30_000, message: 'the shot was never judged' },
    )
    .toBeLessThan(before)
}

test.describe('Royaume Foot', () => {
  test('boots into a 3D menu with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

    await page.goto('./')
    await expect(page.locator('canvas')).toBeVisible()

    // The menu renders the chosen princess, so a live WebGL context matters.
    const hasContext = await page.evaluate(() => {
      const c = document.querySelector('canvas')!
      return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
    })
    expect(hasContext).toBe(true)
    expect(errors).toEqual([])
  })

  test('plays a full round and always ends in a reward', async ({ page }) => {
    // Five shots, each with a ~3s flight-and-celebrate cycle, is well past
    // Playwright's 30s default.
    test.setTimeout(150_000)

    await page.goto('./')
    await page.getByRole('button', { name: PLAY }).first().click()

    await expect(page.getByTestId('shots')).toBeVisible()
    expect(await shotsLeft(page)).toBe(5)

    // Deliberately spread across the goal, including the far corners.
    const flicks: [number, number][] = [
      [0, 260],
      [-80, 240],
      [80, 300],
      [-40, 340],
      [40, 220],
    ]
    for (const [dx, dy] of flicks) await takeShot(page, dx, dy)

    expect(await shotsLeft(page)).toBe(0)

    // Whatever happened, the round ends on a celebration and at least one star.
    const again = page.getByRole('button', { name: /Encore|Again|Nochmal|Otra vez|Ancora|Outra/ })
    await expect(again).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/⭐/).first()).toBeVisible()
  })

  test('keeps the wardrobe reachable and remembers the choice', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('button', { name: /habiller|Dress up|Anziehen|Vestir|Vestire/ }).first().click()

    // Amara is unlocked from the start; Freya costs stars and must stay locked.
    const amara = page.getByRole('button', { name: 'Amara' })
    await expect(amara).toBeEnabled()
    await amara.click()
    await expect(amara).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('button', { name: /Freya/ })).toBeDisabled()

    await page.reload()
    await page.getByRole('button', { name: /habiller|Dress up|Anziehen|Vestir|Vestire/ }).first().click()
    await expect(page.getByRole('button', { name: 'Amara' })).toHaveAttribute('aria-pressed', 'true')
  })
})
