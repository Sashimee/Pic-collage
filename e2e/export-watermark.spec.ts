import { test, expect } from '@playwright/test'
import { openApp, pngFile, waitForElements } from './helpers'

/**
 * The bug: the watermark/print pass drew the rendered board through
 * `img.src = dataUrl; ctx.drawImage(img, …)`. Image decoding is asynchronous
 * even for a same-origin data URL, so drawImage drew nothing and every export
 * with a watermark on came out blank — a transparent PNG, or a black JPEG —
 * carrying only the watermark text. A tester hit it and thought sharing was
 * broken.
 *
 * jsdom has no real canvas, so this is the only place the actual pixels can be
 * checked. It samples the exported image rather than trusting that a file
 * appeared, which is exactly what let the bug through.
 */

/** Capture the blob handed to the download anchor and report its pixels. */
async function installExportProbe(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __lastExport?: Blob }
    const orig = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      if (obj instanceof Blob && obj.type.startsWith('image/')) w.__lastExport = obj
      return orig(obj)
    }
  })
}

async function analyseExport(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const blob = (window as unknown as { __lastExport?: Blob }).__lastExport
    if (!blob) return null
    const bmp = await createImageBitmap(blob)
    const c = document.createElement('canvas')
    c.width = bmp.width
    c.height = bmp.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, c.width, c.height)

    let opaque = 0
    let nonBlack = 0
    const colours = new Set<string>()
    // Sample a coarse grid — reading every pixel of a 2160×2700 export is slow.
    for (let y = 0; y < c.height; y += 8) {
      for (let x = 0; x < c.width; x += 8) {
        const i = (y * c.width + x) * 4
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
        if (a > 8) opaque++
        if (a > 8 && r + g + b > 24) nonBlack++
        colours.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 4}`)
      }
    }
    const sampled = Math.ceil(c.height / 8) * Math.ceil(c.width / 8)
    return {
      width: c.width,
      height: c.height,
      type: blob.type,
      opaqueRatio: opaque / sampled,
      nonBlackRatio: nonBlack / sampled,
      distinctColours: colours.size,
    }
  })
}

test.describe('watermarked export', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
    await page.locator('#empty-gallery-input').setInputFiles(pngFile())
    await waitForElements(page, 'photo')
    await installExportProbe(page)
  })

  test('contains the collage, not just the watermark', async ({ page }) => {
    await page.evaluate(() => {
      const st = window.__editor!.getState() as unknown as {
        setWatermark: (p: { enabled: boolean; text: string }) => void
      }
      st.setWatermark({ enabled: true, text: 'Pic Collage' })
    })

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()

    await expect.poll(() => analyseExport(page)).not.toBeNull()
    const shot = (await analyseExport(page))!

    // The board background alone fills the frame, so a correct export is
    // essentially fully opaque. The broken one was ~0 outside the glyphs.
    expect(shot.opaqueRatio).toBeGreaterThan(0.9)
    expect(shot.nonBlackRatio).toBeGreaterThan(0.9)
    // ...and it is a real picture, not one flat colour plus text.
    expect(shot.distinctColours).toBeGreaterThan(1)
  })

  test('a plain export is unaffected by the overlay path', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()

    await expect.poll(() => analyseExport(page)).not.toBeNull()
    const shot = (await analyseExport(page))!
    expect(shot.opaqueRatio).toBeGreaterThan(0.9)
    expect(shot.type).toBe('image/png')
  })

  test('renders the full-resolution photo, not the 1080px preview', async ({ page }) => {
    // `exporting` swaps PhotoNode to `originalSrc`, but it used to be set and
    // cleared inside one synchronous tick — React never re-rendered, so every
    // export quietly snapshotted the preview. Imports cap previews at 1080px
    // while the board renders at 2160px, so half the detail was thrown away.
    // Watch for the flag actually reaching a rendered frame: sample it from a
    // rAF loop, which only sees states React has committed. The old code
    // flipped it on and off between two statements, so no frame ever saw it.
    await page.evaluate(() => {
      const w = window as unknown as { __sawExporting: boolean }
      w.__sawExporting = false
      const tick = () => {
        if ((window.__editor!.getState() as unknown as { exporting: boolean }).exporting) {
          w.__sawExporting = true
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()
    await expect.poll(() => analyseExport(page)).not.toBeNull()

    const seen = await page.evaluate(
      () => (window as unknown as { __sawExporting: boolean }).__sawExporting,
    )
    expect(seen).toBe(true)

    // ...and it must not stay pinned to originals, which is the heavy state.
    const settled = await page.evaluate(
      () => (window.__editor!.getState() as unknown as { exporting: boolean }).exporting,
    )
    expect(settled).toBe(false)
  })

  test('print marks also keep the collage', async ({ page }) => {
    await page.evaluate(() => {
      const st = window.__editor!.getState() as unknown as {
        setPrint: (p: { enabled: boolean }) => void
      }
      st.setPrint({ enabled: true })
    })

    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download PNG' }).click()

    await expect.poll(() => analyseExport(page)).not.toBeNull()
    const shot = (await analyseExport(page))!
    expect(shot.opaqueRatio).toBeGreaterThan(0.9)
    expect(shot.nonBlackRatio).toBeGreaterThan(0.85)
  })
})
