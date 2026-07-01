# Pic Collage Maker — project guide

A photo collage maker & editor. 100% client-side, no backend. Built as
an installable PWA from a single codebase, deployed to GitHub Pages.

## Stack

- **React 19 + Vite + TypeScript**
- **react-konva / konva** — the canvas editor (Stage → Layer → board Group)
- **Tailwind v4** via `@tailwindcss/vite` (no PostCSS config; `@import "tailwindcss"` in `src/index.css`)
- **zustand** — editor state (`src/store/editorStore.ts`)
- **vite-plugin-pwa** — manifest + service worker (`registerType: 'autoUpdate'`)
- Deployed to **GitHub Pages** via `.github/workflows/deploy.yml`

## Commands

```bash
npm run dev            # dev server (HMR)
npm run build          # tsc -b && vite build  →  dist/
npm run preview        # serve the production build locally
npm run lint           # type-check only
npm run generate:icons # regenerate PWA PNG icons from scripts/generate-icons.mjs
```

## Deployment

- `vite.config.ts` sets `base: '/Pic-collage/'` — the repo subpath on GitHub Pages.
  **If the repo is renamed, update `BASE`** in `vite.config.ts` (it also feeds the
  PWA `start_url`/`scope`).
- Every push to `main` triggers the Actions workflow → builds → deploys to Pages.
- **One-time setup:** GitHub repo → Settings → Pages → Source = **GitHub Actions**.
- Live URL: `https://<owner>.github.io/Pic-collage/`.

## Architecture

Everything drawn on the board is a `CanvasElement` — a discriminated union
(`photo | text | sticker`) in `src/types.ts`. Adding a new element type means:
extend the union, add an `add*` action in the store, and add a case to
`ElementNode` in `src/components/CanvasNodes.tsx`. The shared `Transformer`
(move/resize/rotate) then works for it automatically.

Key files:

| Area | File |
| --- | --- |
| State (elements, selection, background, mode, z-order) | `src/store/editorStore.ts` |
| Canvas, gestures (pinch/wheel zoom), transformer, export handle | `src/components/EditorCanvas.tsx` |
| Per-element Konva nodes + filter caching | `src/components/CanvasNodes.tsx` |
| Grid collage rendering (clipped cover-fit cells) | `src/components/GridView.tsx` |
| Solid/gradient background | `src/components/Background.tsx` |
| Filter presets → Konva filter stack | `src/lib/filters.ts` |
| Grid layout presets | `src/lib/grids.ts` |
| PNG/JPG export + Web Share | `src/lib/exportImage.ts` |
| Bottom tool tabs + panels | `src/components/Toolbar.tsx`, `src/components/Panels.tsx` |
| i18n (DE/EN, flag switcher) | `src/i18n/translations.ts`, `src/i18n/useLang.ts`, `src/components/LangSwitcher.tsx` |

**Coordinate model:** elements store positions in *board design units*
(`boardWidth × boardHeight`, e.g. 1080×1350). The board is a Konva `Group` that
is scaled/panned to fit the viewport (`tf` in `EditorCanvas`). Export resets the
board group to identity and snapshots the exact `boardWidth × boardHeight`
region at `pixelRatio: 2`, so output resolution is independent of on-screen zoom.

**Filters** are applied by caching the Konva node (`node.cache()`) and setting a
filter stack (Brighten + Contrast + HSL, plus Grayscale/Sepia for presets).
Re-run whenever the image or filter values change.

## MVP roadmap

Done:

- [x] Import multiple photos (gallery + camera `capture`)
- [x] Free canvas mode with move / resize / rotate (Konva Transformer)
- [x] Preset collage grids (2 / 3 / 4 photos) with cover-fit cells
- [x] Text elements (font, size, colour, bold) — double-tap or panel to edit
- [x] Stickers / emojis
- [x] Backgrounds: solid colour + gradient (angle)
- [x] Filters: brightness / contrast / saturation + presets (Vivid, Warm, Cool, Sepia, B&W)
- [x] Reorder layers (bring forward / send backward), duplicate, delete
- [x] Export PNG / JPG (download) + Web Share API
- [x] Mobile-first touch UI, pinch-to-zoom / wheel-zoom, canvas aspect presets
- [x] Installable PWA (manifest + service worker) + GitHub Pages CI/CD
- [x] Bilingual UI (German / English) with flag switcher, defaults to system language

To add a UI string: add the key to both `de` and `en` in
`src/i18n/translations.ts`, then use `const t = useT()` and `t('your.key')` in the
component. English is the fallback.

Nice-to-have / next:

- [ ] Per-cell pan & zoom inside grid cells (currently auto cover-fit + centre)
- [ ] Undo / redo history
- [ ] Draggable sticker/text via richer gestures (two-finger rotate on elements)
- [ ] More grid layouts and adjustable gutter / corner radius
- [ ] Persist work in `localStorage` / IndexedDB
- [ ] Crop tool, more filters (blur, vignette)
- [ ] **Capacitor** wrapper for App Store / Play Store (structure is ready; not installed)

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`…).
- Keep everything client-side — no network calls, nothing leaves the device.
- Board coordinates are design units, not screen pixels (see above).
