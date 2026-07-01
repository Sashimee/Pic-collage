# 🎨 Pic Collage Maker

A photo collage maker & editor that runs **entirely in your browser** —
no account, no backend, nothing uploaded. Installable on iPhone and Android as a
PWA, deployed as static files to GitHub Pages.

## Features

- 📷 Import multiple photos from gallery or camera
- 🧩 Collage grids (2/3/4 photos) **and** a free canvas
- ✋ Move, resize, rotate, reorder, duplicate every element
- 🔤 Text (font, size, colour) and 😊 emoji stickers
- 🎨 Backgrounds: solid colour or gradient
- ✨ Filters: brightness, contrast, saturation + presets (Vivid, Warm, Cool, Sepia, B&W)
- 💾 Export to PNG / JPG and share via the Web Share API
- 📱 Mobile-first touch UI with pinch-to-zoom — installable to the home screen

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages automatically
(`.github/workflows/deploy.yml`). One-time setup: **Settings → Pages → Source →
GitHub Actions**. The app is served from the `/Pic-collage/` subpath — see
`base` in `vite.config.ts`.

## Tech

React + Vite + TypeScript · react-konva (Konva.js) · Tailwind v4 · zustand ·
vite-plugin-pwa. Structured so [Capacitor](https://capacitorjs.com/) can be added
later for native App Store / Play Store builds.

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes and the full roadmap.
