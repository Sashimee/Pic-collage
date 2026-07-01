# Pic Collage Maker — project guide

A **Pic Collage Maker** — a photo collage maker & editor that runs **100 %
client-side** in the browser. No backend, no account, nothing uploaded; the build
is static files hosted for free on GitHub Pages, installable as a PWA on iPhone
and Android. Bilingual UI (German / English).

> **Read the [Git workflow](#git-workflow) section before committing anything.**
> Short version: branch every feature off `dev`; **never push or merge without
> the user's explicit go-ahead.**

---

## Tech stack

| Concern | Choice | Notes |
| --- | --- | --- |
| UI | **React 19** + **TypeScript** | function components + hooks |
| Build/dev | **Vite 8** (`@vitejs/plugin-react`) | HMR, static build to `dist/` |
| Canvas editor | **konva** + **react-konva 19** | `Stage → Layer → board Group → nodes` |
| Styling | **Tailwind v4** via `@tailwindcss/vite` | no PostCSS config; `@import "tailwindcss"` in `src/index.css` |
| State | **zustand** | `src/store/editorStore.ts`, `src/i18n/useLang.ts` |
| PWA | **vite-plugin-pwa** | manifest + service worker, `registerType: 'autoUpdate'` |
| Hosting | **GitHub Pages** | `.github/workflows/deploy.yml` on push to `main` |

No runtime dependency beyond the above — filters, export, i18n, icons are all
hand-rolled to stay lightweight and dependency-free.

## Commands

```bash
npm run dev            # dev server with HMR (http://localhost:5173/<base>/)
npm run build          # tsc -b && vite build  →  dist/
npm run preview        # serve the production build locally
npm run lint           # type-check only (tsc -b --noEmit)
npm run generate:icons # regenerate PWA PNG icons from scripts/generate-icons.mjs
```

## Directory map

```
Pic-Collage-Maker/
├── index.html                  # entry HTML: fonts, PWA/apple meta, viewport (no user-scalable)
├── vite.config.ts              # base path + react/tailwind/PWA plugins + manifest
├── package.json                # name: pic-collage-maker
├── tsconfig*.json              # app + node project references
├── scripts/generate-icons.mjs  # dependency-free PNG icon generator (zlib) → public/
├── public/                     # favicon.svg + generated pwa-*.png / apple-touch-icon.png
├── .github/workflows/deploy.yml# build + deploy to GitHub Pages
└── src/
    ├── main.tsx                # React root
    ├── App.tsx                 # layout shell (Header / Canvas+SelectionBar / Toolbar) + export flow
    ├── index.css               # Tailwind import + base/touch styles
    ├── types.ts                # CanvasElement union, Background, Grid types, DEFAULT_FILTERS
    ├── store/
    │   └── editorStore.ts      # zustand: elements, selection, background, mode, z-order, actions
    ├── i18n/
    │   ├── translations.ts     # Lang type, LANGS (flags), de/en string maps
    │   └── useLang.ts          # lang store (detect+persist) + useT() translator hook
    ├── hooks/
    │   └── useImage.ts         # URL → decoded HTMLImageElement
    ├── lib/
    │   ├── grids.ts            # normalised collage grid presets (GRID_LAYOUTS)
    │   ├── filters.ts          # FILTER_PRESETS + computeFilterConfig() → Konva filter stack
    │   ├── importPhotos.ts     # File → object URL + intrinsic size
    │   └── exportImage.ts      # exportBoard(), download, Web Share
    └── components/
        ├── EditorCanvas.tsx    # Konva stage, board group, gestures, transformer, export handle
        ├── CanvasNodes.tsx     # ElementNode dispatcher: PhotoNode / TextNode / StickerNode
        ├── GridView.tsx        # grid-mode: clipped cover-fit photo cells + placeholders
        ├── Background.tsx      # solid / linear-gradient board background rect
        ├── Toolbar.tsx         # bottom tab bar + active panel sheet
        ├── Panels.tsx          # Photos / Layout / Text / Stickers / Background / Filters panels
        ├── SelectionBar.tsx    # floating per-element actions (dup / layer / delete)
        ├── HeaderBar.tsx       # brand, LangSwitcher, New, Export menu
        ├── LangSwitcher.tsx    # 🇩🇪 / 🇬🇧 flag buttons
        └── ui.tsx              # Slider / ColorField / Chip / PrimaryButton primitives
```

## Data model (`src/types.ts`)

Everything drawn on the board is a **`CanvasElement`** — a discriminated union
keyed by `type`:

```ts
type CanvasElement = PhotoElement | TextElement | StickerElement
// BaseElement: id, type, x, y, rotation, scaleX, scaleY  (positions are BOARD units)
// PhotoElement:   src, width, height, filters: PhotoFilters
// TextElement:    text, fontFamily, fontSize, fill, fontStyle
// StickerElement: emoji, fontSize
```

Plus `Background` (`solid | gradient`, colours, angle), `EditorMode`
(`free | grid`), and normalised `GridLayout` / `GridCell`.

**To add a new element type:** extend the union in `types.ts` → add an `add*`
action in `editorStore.ts` → add a `case` in `ElementNode`
(`src/components/CanvasNodes.tsx`). The shared `Transformer` (move/resize/rotate)
then works for it automatically.

## State (`src/store/editorStore.ts`)

Single zustand store. Fields: `boardWidth/boardHeight` (design units, default
1080×1350), `background`, `mode`, `gridId`, `elements`, `selectedId`.

Actions: `addPhoto`, `addText`, `addSticker`, `updateElement`, `updateFilters`,
`duplicateElement`, `removeElement`, `select`, `bringForward`, `sendBackward`,
`bringToFront`, `sendToBack`, `setBackground`, `setMode`, `setGrid`,
`setBoardSize`, `clearAll`; selector `selected()`.

- **z-order = array order** — `elements[0]` is bottom, last is top. The reorder
  actions swap/move within the array.
- **Object-URL lifecycle** — `removeElement`/`clearAll` revoke a photo's `blob:`
  URL, but only if no other element still references the same `src` (duplicates
  share it).
- **`window.__editor`** is exposed in dev (`import.meta.env.DEV`) for
  console/CDP-driven testing (used by the headless verification scripts).

## Rendering & canvas (`src/components/EditorCanvas.tsx`)

- Structure: `Stage` (viewport-sized) → one `Layer` → a **board `Group`** (holds
  `Background` + elements) **+ a sibling `Transformer`**. The transformer is a
  sibling (not a child) of the board group, so it is excluded from exports and
  its handles stay a constant on-screen size regardless of board zoom.
- **View transform `tf = {x, y, scale}`** positions/scales the board group.
  `fitToScreen()` centres and fits the board on resize; **wheel** and two-finger
  **pinch** gestures zoom-to-point by updating `tf` (canonical Konva math).
- **Free mode:** all elements render as draggable/transformable `ElementNode`s.
  **Grid mode:** `GridView` lays photos into clipped cover-fit cells; **non-photo
  elements (text/stickers) still render as free overlays on top** of the grid.
- **Transformer attach rule:** attach to the selected element when it is a free
  node — any element in free mode, only non-photo elements in grid mode (grid
  photos keep a tap-highlight, no handles). Found via `stage.findOne('#'+id)`.
- Tap on empty stage / the `background` rect clears the selection.
- Text edit: double-tap a text node → `window.prompt` (also editable in the Text
  panel).

## Coordinate & export model

Element coordinates are stored in **board design units** (`boardWidth ×
boardHeight`), independent of on-screen size. The board group is scaled/panned for
display only. **`exportBoard()`** (`src/lib/exportImage.ts`) temporarily resets
the board group to identity (scale 1, pos 0) and snapshots exactly the
`boardWidth × boardHeight` region at `pixelRatio: 2` → output resolution is
independent of the current view zoom. `App.tsx` clears the selection and waits a
frame before exporting so no transformer/highlight is captured; PNG/JPG download
or Web Share follow.

## Filters (`src/lib/filters.ts`)

`computeFilterConfig(filters)` maps the high-level `PhotoFilters` (brightness /
contrast / saturation + a preset) to a concrete Konva filter stack
(`Brighten` + `Contrast` + `HSL`, plus `Grayscale`/`Sepia` for presets) and the
numeric attrs each filter reads. In `PhotoNode`/`CellPhoto` the effect calls
`node.cache()` then applies the stack; **re-run whenever the image or filter
values change** (that's the dependency list).

## Grids (`src/lib/grids.ts`, `src/components/GridView.tsx`)

`GRID_LAYOUTS` are normalised (0..1) cell rectangles (2-vertical, 2-horizontal,
3-columns, 3 (1 big + 2), 2×2). `GridView` scales them to the board with a small
gutter, assigns `photos[i]` to cell `i` (extra photos hidden, empty cells show a
dashed "＋" placeholder), and draws each photo **object-fit: cover** inside a
clipped `Group`. Selecting a cell selects that photo (for filters/delete).

## i18n (`src/i18n/`)

Lightweight, dependency-free. `translations.ts` holds flat `de`/`en` key→string
maps and `LANGS` (flag + label). `useLang.ts` is a zustand store that **defaults
to the browser language** (`navigator.language`, `de-*` → German else English),
**persists** the choice in `localStorage`, and sets `<html lang>`. `useT()`
returns a `t(key)` translator (English is the fallback; unknown key → the key).
`LangSwitcher` (in the header) toggles language live. **To add a UI string:** add
the key to *both* `de` and `en`, then `const t = useT()` and `t('your.key')`.
Font names, the bold "B", emoji and grid glyphs stay untranslated.

## PWA & deployment

- Manifest + service worker via vite-plugin-pwa (`vite.config.ts`). Icons are
  generated by `scripts/generate-icons.mjs` (pure zlib PNG encoder) into
  `public/`; `favicon.svg` is the source motif.
- **`base` in `vite.config.ts` must equal the GitHub Pages subpath** (the repo
  name), currently `'/Pic-collage/'`. It also feeds the manifest `start_url` /
  `scope`. **If the repo is renamed, update `BASE`** (and README/live-URL refs).
- CI: every push to `main` runs `deploy.yml` → `npm install` (see gotchas) →
  `npm run build` → upload `dist/` → deploy to Pages. Node 24.
- One-time (admin): repo **public** + Settings → Pages → Source = **GitHub
  Actions**.
- Live: `https://sashimee.github.io/Pic-collage/`.

## Known gotchas / constraints

- **Permissions:** the local git user is **G1NG4R** and is only a **`write`**
  collaborator; the repo **owner is Sashimee** ("Alex"). Admin actions — renaming
  the repo, changing visibility, enabling Pages — return `404` and **must be done
  by Sashimee**. Pushing to `main` works.
- **Pending rename:** the app display name is already **"Pic Collage Maker"**
  everywhere and the local folder is `/home/tim/dev/Pic-Collage-Maker`, but the
  GitHub repo is still `Pic-collage`. Renaming it to `Pic-Collage-Maker` (admin)
  will change the live URL → then update `BASE`, manifest, README/CLAUDE URLs and
  `git remote set-url` in one follow-up push.
- **CI uses `npm install`, not `npm ci`** — npm's cross-version handling of
  optional platform deps (`@emnapi/*`) made a valid lockfile read as out-of-sync
  under `npm ci`. Don't switch it back without regenerating the lockfile to match.
- Emoji flags render as flags on iOS/Android; some desktop/Windows fonts show
  letters — cosmetic only.
- React **StrictMode** is on (dev double-invoke) — keep effects idempotent.

## Git workflow

**These rules are binding for Claude in every session.**

- **`main` = production.** Every push to `main` auto-deploys to GitHub Pages, so
  `main` must stay deployable at all times.
- **`dev` = integration branch.**
- **Every new feature or fix starts on its own branch, created from `dev`**
  (e.g. `feat/undo-redo`, `fix/grid-gap`). Do the work there, commit locally with
  Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:` …).
- **Only the user (Tim) decides when to push and when to merge.** Claude may
  commit locally on the feature branch but **must never push to a remote, and
  never merge** (feature → `dev`, or `dev` → `main`) **without an explicit
  instruction.** When work is ready, say so and ask — don't act.
- **Release / deploy = merge `dev` → `main` and push — only on the user's say-so.**

Typical cycle:

```bash
git switch dev
git switch -c feat/my-thing      # branch off dev
# …commit work locally…
# → then STOP and ask the user before pushing or merging
```

## Roadmap

Done: multi-photo import (gallery + camera), free canvas with move/resize/rotate,
preset grids (2/3/4), text, emoji stickers, solid/gradient backgrounds, filters
(brightness/contrast/saturation + Vivid/Warm/Cool/Sepia/B&W), layer reorder /
duplicate / delete, PNG/JPG export + Web Share, mobile pinch/wheel zoom + aspect
presets, installable PWA + Pages CI/CD, bilingual DE/EN UI.

Next ideas: undo/redo history · per-cell pan & zoom inside grid cells · richer
touch gestures (two-finger rotate on elements) · more grid layouts + adjustable
gutter/corner radius · persist work in localStorage/IndexedDB · crop tool · more
filters (blur, vignette) · **Capacitor** wrapper for App Store / Play Store
(structure is ready; not installed).

## Conventions

- Conventional Commits.
- Everything stays **client-side** — no network calls, nothing leaves the device.
- Board coordinates are **design units**, not screen pixels (see above).
- Match the surrounding code's style; keep new code dependency-light.
