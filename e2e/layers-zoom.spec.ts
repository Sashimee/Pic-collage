import { test, expect } from '@playwright/test'
import { openApp, pngFile, settleCanvas, skipGallery, waitForElements } from './helpers'

/** Element ids bottom-to-top — the store's own z-order. */
const order = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__editor!.getState().elements.map((e) => e.id))

/** Board centre as a fraction of its host box, so it survives any viewport. */
async function boardCentre(page: import('@playwright/test').Page) {
  await settleCanvas(page)
  return page.evaluate(() => {
    const r = window.__boardRect!()
    const host = document.querySelector('canvas')!.parentElement!.getBoundingClientRect()
    return {
      x: (r.x + r.width / 2 - host.left) / host.width,
      y: (r.y + r.height / 2 - host.top) / host.height,
    }
  })
}

/** ZoomControls' +/− buttons call setCanvasZoom; go through the same door.
 *  Clicking them directly is unreliable because the floating selection bar
 *  overlaps them whenever something is selected. */
async function setZoom(page: import('@playwright/test').Page, z: number) {
  await page.evaluate((v) => {
    ;(window.__editor!.getState() as unknown as {
      setCanvasZoom: (n: number) => void
    }).setCanvasZoom(v)
  }, z)
  await page.waitForTimeout(150)
}

test.describe('canvas zoom', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
  })

  test('keeps the board centred through zoom in and out', async ({ page }) => {
    // The zoom anchor used to be the raw viewport centre, but fitToScreen
    // centres the board inside the *inset* box (tool rail, zoom controls, and
    // on mobile an open panel). Anchoring somewhere the board isn't centred
    // walked it further off-centre with every press.
    const before = await boardCentre(page)

    await setZoom(page, 1.6)
    const zoomedIn = await boardCentre(page)
    expect(zoomedIn.x).toBeCloseTo(before.x, 2)
    expect(zoomedIn.y).toBeCloseTo(before.y, 2)

    await setZoom(page, 0.5)
    const zoomedOut = await boardCentre(page)
    expect(zoomedOut.x).toBeCloseTo(before.x, 2)
    expect(zoomedOut.y).toBeCloseTo(before.y, 2)
  })

  test('stays centred with a panel open, where the inset is largest', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const before = await boardCentre(page)

    await setZoom(page, 1.5)
    const after = await boardCentre(page)
    expect(after.x).toBeCloseTo(before.x, 2)
    expect(after.y).toBeCloseTo(before.y, 2)
  })
})

test.describe('layer reordering', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
    await skipGallery(page)
    await page.getByRole('button', { name: 'Text', exact: true }).click()
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Add text/ }).click()
      await page.waitForTimeout(120)
    }
    await waitForElements(page, 'text', 3)
    await page.getByRole('button', { name: 'Layers', exact: true }).click()
    await expect(page.locator('[data-drag-handle]')).toHaveCount(3)
  })

  test('dragging the grip reorders the layer', async ({ page }) => {
    // Reordering runs on pointer events now. It used to use HTML5
    // drag-and-drop, which never fires from touch on iOS or Android — so on a
    // phone the grip looked draggable and did nothing at all. A mouse drag
    // exercises the same pointerdown/move/up path a finger produces.
    const before = await order(page)
    const grips = page.locator('[data-drag-handle]')
    const from = (await grips.nth(0).boundingBox())!
    const to = (await grips.nth(2).boundingBox())!

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(
        from.x + from.width / 2,
        from.y + from.height / 2 + ((to.y - from.y) * i) / 8,
      )
      await page.waitForTimeout(16)
    }
    await page.mouse.up()

    await expect.poll(() => order(page)).not.toEqual(before)
    // The list renders top-layer-first, so the row that was at the top is now
    // the bottom of the z-order.
    expect((await order(page))[0]).toBe(before[before.length - 1])
  })

  test('dragging down the list sends the layer backward, not forward', async ({ page }) => {
    // The old code mapped "down the list" to bringForward, but the list is
    // rendered top-layer-first — so it moved layers the wrong way even on
    // desktop, where the drag itself worked.
    const before = await order(page)
    const topLayerId = before[before.length - 1]

    await page.locator('[data-drag-handle]').nth(0).focus()
    await page.keyboard.press('ArrowDown')

    await expect.poll(() => order(page)).not.toEqual(before)
    const after = await order(page)
    expect(after.indexOf(topLayerId)).toBe(before.indexOf(topLayerId) - 1)
  })

  test('the grip works from the keyboard too', async ({ page }) => {
    const before = await order(page)
    const bottomLayerId = before[0]

    await page.locator('[data-drag-handle]').nth(2).focus() // bottom row
    await page.keyboard.press('ArrowUp')

    await expect.poll(() => order(page)).not.toEqual(before)
    expect((await order(page)).indexOf(bottomLayerId)).toBe(1)
  })
})
