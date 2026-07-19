## Phase 1 Implementation Plan — Client-Only Architecture Redesign

Grounded in the actual codebase (`editorStore.ts` single Zustand store, `persistence.ts` single-doc IndexedDB, Konva `Stage→Layer→board Group`, no undo/redo, no multi-project support).

### Stage 0 — Safety net (before touching store/export)
- `src/store/editorStore.test.ts` (new): cover `addPhoto`/`removeElement`/reorder/z-order + object‑URL revoke logic.
- `src/lib/exportImage.test.ts` (new): cover `exportBoard()` identity‑reset behavior.
- Per PHASE0_AUDIT.md, this is the riskiest untested surface and must land before refactoring underneath it.

### Stage 1 — Command/undo‑redo layer
- `src/store/history.ts` (new): generic command stack (`push`, `undo`, `redo`, `canUndo/canRedo`), capped depth (e.g. 50).
- `src/store/editorStore.ts`: wrap existing mutating actions (`addPhoto`, `updateElement`, `removeElement`, `bringForward`/`sendBackward`, `setBackground`, `setGrid`) as commands instead of direct `set()` calls.
- `src/components/Toolbar.tsx` / `HeaderBar.tsx`: add undo/redo buttons + keyboard shortcuts (Ctrl/Cmd+Z, Shift+Z).
- This is the top roadmap item and the prerequisite for non‑destructive editing in Phase 2.

### Stage 2 — Data model: Projects → Layers → Assets
- `src/types.ts`: introduce `Project { id, name, createdAt, updatedAt, boardWidth, boardHeight, background, mode, gridId, elements }`, keeping `CanvasElement` union as‑is (no breaking change to Phase 2 layer work yet — layers stay flat arrays for now, grouping deferred to Phase 2).
- `src/lib/persistence.ts`: extend `DOC_STORE` from a singleton (`DOC_KEY = 'current'`) to a keyed project store (`projects` object store, key = `project.id`), plus a small `meta` store for "last opened project id". Keep `PHOTO_STORE` blob keying unchanged.
- `src/store/projectsStore.ts` (new): list/open/rename/duplicate/delete projects, wraps `persistence.ts`.

### Stage 3 — Portable `.piccollage` file
- `src/lib/projectFile.ts` (new): pack a `Project` + referenced photo blobs into a single downloadable file (dependency‑free — e.g. a minimal custom container: JSON manifest + concatenated base64 blobs, or a hand‑rolled zip writer consistent with `scripts/generate-icons.mjs`'s existing zlib approach). Export/import functions only; no network.
- `src/components/HeaderBar.tsx`: add “Save as .piccollage” / “Open .piccollage” menu items.

### Stage 4 — Plugin/extensibility hooks
- `src/lib/plugins/types.ts` (new): `FilterPlugin`, `StickerPackPlugin` interfaces.
- `src/lib/plugins/registry.ts` (new): `registerFilter()`/`registerStickerPack()`, in‑memory registry consumed by `Panels.tsx`.
- Wire `src/lib/filters.ts`'s `FILTER_PRESETS` and sticker list through the registry so built‑ins register via the same API future third‑party modules would use — proves the seam without shipping a loader yet (dynamic `import()` loading deferred to Phase 2).

### Stage 5 — Docs
- `docs/adr/0001-client-only-architecture.md` (new): record the Konva‑stays, Zustand‑stays, IndexedDB‑multi‑project, dependency‑free‑plugin decisions and alternatives rejected.
- Update `CLAUDE.md`'s directory map, data model, and roadmap sections to match Stages 1‑4.

### Order of execution
Stage 0 → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 (each stage on its own `feat/` branch off `dev`, per the repo's git workflow; commit locally only, no push/merge without explicit go‑ahead).

### Expected Claude usage
Roughly 6 focused sessions (one per stage), each ~5‑15 tool calls (read/edit/test‑run). Total order‑of‑magnitude: **~60‑90 tool‑using turns, ~250K‑400K tokens** across the phase, with prompt caching keeping repeat‑context cost low since `CLAUDE.md`/`types.ts`/`editorStore.ts` get re‑read often.