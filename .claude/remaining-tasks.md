# Remaining Tasks — Complete Execution Plan

Execute ALL remaining tasks from PLAN.md one after another. Do NOT ask the user for anything. Commit after each phase. Push when done.

## Branch: phase-all-remaining (already created, checked out)

## Phase Execution Order

### Batch 1: Phase 2 Gaps
1. **P2.11 Alignment guides canvas wiring** — Wire snap.ts to EditorCanvas.tsx drag-move handler; render visual guide lines (red dashed lines) during drag; hold Shift to disable snapping.
2. **P2.12 Grid & rulers** — Add toggleable dot/line grid background to canvas; add optional pixel rulers on edges; add "Snap to grid" toggle in settings.
3. **P2.15 Advanced filters** — Add hue shift, exposure, shadows/highlights, temperature/tint, clarity to FilterOperation union and FilterPanel UI.
4. **P2.10 Shape library expansion** — Add arrow heads, speech bubble, heart, star variants to shape library panel.
5. **P2.14 Bulk operations** — Add "Select all photos", "Apply filter to all photos", "Distribute evenly" buttons to SelectionBar.

### Batch 2: Phase 3 Gaps
6. **P3.3 Smart crop** — Wire faceDetection.ts computeSmartCrop to a "Smart Crop" button on selected photos.
7. **P3.11 WASM module manager** — Create src/lib/wasmLoader.ts with lazy model loading, IndexedDB cache, progress events UI.
8. **P3.12 WebGPU acceleration** — Detect WebGPU support; use for heavy filter ops if available; fallback to WebGL 2 / Canvas.

### Batch 3: Phase 4 Gaps
9. **P4.2 WebM/MP4 with transitions** — Add fade transition between frames in exportWebM; add optional music overlay.
10. **P4.6 SVG export** — Create exportSVG.ts that extracts text and shapes as true SVG paths.
11. **P4.8 Print-ready mode** — Add CMYK simulation filter, bleed marks overlay, crop marks toggle.
12. **P4.10 EXIF preservation** — Wire piexif.js to preserve original EXIF in exported JPEGs.
13. **P4.11 Watermarking** — Add watermark text/image overlay at export time.

### Batch 4: Phase 5 Gaps
14. **P5.3 Image pyramid** — Store multiple resolutions per photo; use viewport-appropriate resolution.
15. **P5.4 Memory pressure handling** — Monitor performance.memory; warn and unload unseen blobs.
16. **P5.7 Version history** — Auto-save snapshots every 5 min; version browser panel.
17. **P5.10 Drag & drop from desktop** — Allow dropping files directly onto canvas from file manager.
18. **P5.11 Clipboard integration** — Copy/paste elements between projects; copy image to system clipboard.
19. **P5.17 Dark/light auto-detect** — Respect prefers-color-scheme on first load.
20. **P5.16 i18n expansion** — Add Spanish (es) translations structure.

### Batch 5: Testing Infrastructure
21. **Setup Vitest** — npm install vitest + @testing-library/react + jsdom; add test scripts.
22. **Unit tests** — Test store actions (undo/redo, add/remove), filter math, export utilities.
23. **Setup Playwright** — npm install @playwright/test; add e2e tests for core flows.
24. **Lighthouse CI** — Add .github/workflows/lighthouse.yml; scan on PR.

## Rules
- Do NOT ask user anything. Execute autonomously.
- After EACH batch: `npm run lint` must pass, then commit.
- Final commit: push branch to origin.
- If Claude Code stalls >5min on a task, skip it and move to next.
- Keep code quality: TypeScript strict, no any, lint clean.
