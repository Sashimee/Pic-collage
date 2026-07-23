# 🎨 Pic Collage Maker

A photo collage maker & editor that runs **entirely in your browser** —
no account, no backend, nothing uploaded. Installable on iPhone and Android as a
PWA, deployed as static files to GitHub Pages.

## Features

- 📷 Import multiple photos from gallery or camera
- 🧩 Preset collage grids **and draw-your-own custom layouts** — plus a free canvas
- ✋ Move, resize, rotate, reorder, duplicate, group, layer every element
- 🔤 Text (custom fonts, rich styling) · 😊 emoji stickers · 🔺 shapes & freehand draw
- 🎨 Backgrounds: solid, gradient, pattern or a full-board photo
- ✨ Filters (brightness, contrast, saturation, hue, temperature, tint, blur,
  vignette + presets) and artistic styles (oil, sketch, pop-art)
- 🪄 On-device photo tools: auto-enhance, background removal, portrait retouch,
  smart crop, caption suggestions — nothing leaves your device
- ↩️ Undo/redo · snapping guides · watermark & print marks · autosave & projects
- 💾 Export to PNG / JPG / SVG / PDF / ZIP and share via the Web Share API
- 🌍 Six languages (EN / DE / ES / FR / IT / PT), light & dark themes
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

React 19 + Vite + TypeScript · react-konva (Konva.js) · Tailwind v4 · zustand ·
framer-motion · lucide · vite-plugin-pwa · pdf-lib / jszip (export). Structured so
[Capacitor](https://capacitorjs.com/) can be added later for native App Store /
Play Store builds.

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes and the full roadmap.
