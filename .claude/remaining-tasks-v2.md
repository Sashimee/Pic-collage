# Remaining Tasks V2 — Complete Execution Plan

Execute ALL remaining tasks from PLAN.md. Do NOT ask user anything. Commit after each feature. Push when done.

## Branch: phase-all-remaining-v2

### Batch A: Advanced Export (Phase 4 gaps)
1. **SVG export** — Create `src/lib/exportSVG.ts` that extracts text and shapes as true SVG paths; add "Export SVG" button to HeaderBar dropdown.
2. **Fade transitions in WebM** — Update `src/lib/exportAnimation.ts` `exportWebM()` to add crossfade transition between frames when multiple elements exist.
3. **EXIF preservation** — Wire `piexif.js` to preserve original EXIF data in exported JPEGs. Add to `src/lib/exportImage.ts`.
4. **Watermark overlay** — Add configurable text watermark (text, position, opacity) to export flow. Add watermark panel in Settings.
5. **CMYK simulation + print marks** — Add CMYK filter simulation overlay toggle, bleed marks, crop marks options for export.

### Batch B: Performance & Polish (Phase 5 gaps)
6. **Image pyramid** — Store 3 resolutions per photo (256x thumbnail, 1080x preview, original) in IndexedDB; use viewport-appropriate resolution in CanvasNodes PhotoNode.
7. **Memory pressure monitoring** — Warn user and unload unseen photo blobs when `performance.memory.usedJSHeapSize > 80%` of limit.
8. **Version history auto-save** — Auto-save project snapshot every 5 minutes to IndexedDB; add VersionHistoryPanel to browse and restore.
9. **Clipboard wiring** — Wire `src/lib/clipboard.ts` into App.tsx: copy/paste elements (Ctrl+C/V), copy image to system clipboard.
10. **Virtualised layer list** — Virtualise layer panel for 50+ layers; use windowing to render only visible rows.

### Batch C: Testing Infrastructure
11. **Playwright E2E** — Create `e2e/collage.spec.ts` with test: upload photo → add text → export PNG → verify download.
12. **Lighthouse CI** — Create `.github/workflows/lighthouse.yml` with thresholds (Performance 70, Accessibility 90, Best Practices 90, SEO 80).
13. **Vitest coverage** — Add more unit tests: snap.ts, autoLayout.ts, colorExtract.ts.

### Batch D: i18n Expansion
14. **French (fr) translations** — Add `fr` to translations.ts with full French map.
15. **Italian (it) translations** — Add `it` to translations.ts with full Italian map.

Rules: Execute autonomously, no questions. `npm run lint` must pass before each commit. If Claude Code stalls >5min, skip and move on.