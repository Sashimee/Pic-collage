# Remaining Tasks V3 — Complete Execution Plan

Execute ALL remaining tasks from PLAN.md. Do NOT ask user anything. Commit after each feature. Push when done.

## Branch: phase-all-remaining-v3

### Batch X: Watermark + Print
1. **Watermark overlay** — Create WatermarkPanel component (Settings panel) with text input, position (top-left/right/bottom-left/right/center), opacity slider, font size. Apply watermark text overlay during export by drawing on canvas before export.
2. **CMYK simulation + print marks** — Add "Print Mode" toggle in export flow: reduce saturation 30%, shift hues toward CMYK. Add optional bleed marks (3mm border) and crop marks (corner crosshairs) overlay during export.

### Batch Y: Polish + History
3. **Memory pressure monitoring** — Create useMemoryPressure hook that polls performance.memory every 30s. If >80% of limit, show toast warning and unload unseen photos.
4. **Version history auto-save** — Create versionStore.ts (Zustand + IndexedDB). Auto-save project snapshot every 5 min. Create VersionHistoryPanel to browse/restore past versions with timestamps. Add to panels.config.tsx.
5. **Clipboard wiring** — Wire src/lib/clipboard.ts into App.tsx keyboard handler: Ctrl+C copies selected element(s) to clipboard store. Ctrl+V pastes. Add "Copy Image" button to SelectionBar for system clipboard.
6. **Virtualised layer list** — Create LayerPanel.tsx with virtual windowing for 50+ elements; only render visible rows. Use react-window or custom.

### Batch Z: Tests + i18n + WebGPU
7. **Vitest tests** — Create src/lib/__tests__/snap.test.ts, autoLayout.test.ts, colorExtract.test.ts with comprehensive tests.
8. **French (fr) translations** — Add fr to translations.ts with ~170 French strings. Update Lang type.
9. **Italian (it) translations** — Add it to translations.ts with ~170 Italian strings. Update Lang type.
10. **WebGPU compute filters** — Detect WebGPU; if available, implement a WebGPU compute pipeline for heavy filter ops (brightness/contrast on large images). Fallback to Canvas/WebGL.

Rules: Execute autonomously, no questions. `npm run lint` must pass before each commit. If Claude Code stalls >5min, skip and move on.