import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The game is a second, independent Vite app inside this repo. It builds into
// dist/game/ so the Pages workflow can upload one artifact containing both the
// collage app (/Pic-collage/) and the game (/Pic-collage/game/).
const BASE = '/Pic-collage/game/'

export default defineConfig({
  // `root` defaults to process.cwd(), not the config directory — the build is
  // launched from the repo root, so point it at this folder explicitly.
  root: import.meta.dirname,
  base: BASE,
  build: {
    outDir: '../dist/game',
    // outDir lives outside `root`; without this Vite refuses to clear it, and
    // clearing it would wipe the collage build that ran first anyway.
    emptyOutDir: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'vendor'
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
})
