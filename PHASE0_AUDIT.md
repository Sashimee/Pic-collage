# Pic Collage Maker — Discovery Audit (Phase 0)

## Architecture Overview
100% client-side photo collage editor — no backend, no accounts, static build hosted on GitHub Pages, installable as a PWA (DE/EN UI). Built on **React 19 + TypeScript**, bundled with **Vite 8**. Canvas editing uses **Konva/react-konva**: a `Stage → Layer → board Group` holding `CanvasElement`s (photo/text/sticker), plus a sibling `Transformer` for move/resize/rotate. Elements live in board-space "design units" (default 1080×1350), decoupled from on-screen zoom/pan — `exportBoard()` resets the group to identity and snapshots at 2x pixel ratio. State is a single **Zustand** store (`editorStore.ts`); separate stores handle language and theme, neither documented in `CLAUDE.md`. Local persistence exists (`src/lib/persistence.ts`), though `CLAUDE.md`'s roadmap still lists it as an unbuilt "next idea" — docs have drifted behind code. CI (`deploy.yml`) builds and deploys `dist/` to GitHub Pages on every push to `main`.

## Dependency List
**Runtime (7):** framer-motion, konva, react-konva, react/react-dom 19, zustand, lucide-react — deliberately minimal; filters/export/i18n are hand-rolled.
**Dev:** vite 8, typescript 6, tailwindcss 4, @vitejs/plugin-react, vite-plugin-pwa, vitest 4 + @testing-library/*, @types/node.
No server, database, or auth deps — consistent with the client-only architecture.

## Technical Debt
1. **Lint doesn't lint.** `.eslintrc.cjs` configures `@typescript-eslint` + `prettier`, but neither ESLint nor those plugins are installed; `npm run lint` is actually just `tsc -b --noEmit`. Dead config, false confidence.
2. **Thin test coverage.** Only one test file (`filters.test.ts`) despite Vitest + Testing Library being fully wired; store/canvas/export logic is untested.
3. **Docs behind code.** `CLAUDE.md`'s directory map and roadmap omit several already-built files (`persistence.ts`, `CropOverlay.tsx`, `BottomSheet.tsx`, `Docks.tsx`, `LayoutPreview.tsx`, `panels.config.tsx`, `useMediaQuery.ts`, `useTheme.ts`, `patterns.ts`, `shapes.ts`, `importFiles.ts`).
4. **CI uses `npm install` not `npm ci`** — a documented workaround for optional-dependency resolution, but a lockfile‑drift risk.
5. **Repo/folder naming mismatch** — GitHub repo is `Pic-collage`, local folder/display name is "Pic Collage Maker"; rename is blocked on admin access the working git user lacks.
6. **No undo/redo, single global store** — flagged as the top roadmap item and a real constraint for future multi‑layer/collab work.

## Recommendations for Phase 0
- Wire up real ESLint (or delete `.eslintrc.cjs` if type‑checking alone is deemed sufficient) — cheap, removes false confidence.
- Refresh `CLAUDE.md`'s directory map/roadmap against actual `src/` before using it to onboard engineers or agents.
- Add unit tests for `editorStore.ts` and `exportImage.ts` before Phase 1 touches them — the riskiest untested surface.
- Document `persistence.ts`'s existing data shape now, since Phase 1's IndexedDB/`.piccollage` schema work will extend it.
- Resolve or explicitly defer the repo‑rename/admin‑access blocker so it doesn't stall later CI/URL changes.
