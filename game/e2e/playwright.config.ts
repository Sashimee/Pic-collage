import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const PORT = 5174
const BASE = `http://localhost:${PORT}/Pic-collage/game/`

/**
 * The game is a separate Vite app, so it needs its own dev server and its own
 * config. The port is pinned away from 5173 so the collage suite and this one
 * can run side by side.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // A phone held upright: the shape the game is actually designed for.
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        launchOptions: {
          // CI runners have no GPU; without a software rasteriser the WebGL
          // context never initialises and every test fails on a blank canvas.
          args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
          // Escape hatch for sandboxes that ship a pre-installed Chromium at a
          // different build number than the one Playwright expects.
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
        },
      },
    },
  ],
  webServer: {
    command: `npx vite -c game/vite.config.ts --port ${PORT} --strictPort`,
    // Playwright runs webServer commands from the config's own directory; the
    // vite config path is relative to the repo root.
    cwd: resolve(import.meta.dirname, '../..'),
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
