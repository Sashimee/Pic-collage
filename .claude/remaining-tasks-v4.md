# Remaining Tasks V4 — Complete Execution Plan

Execute ALL remaining tasks from PLAN.md. Do NOT ask user anything. Commit after each feature. Push when done.

## Branch: phase-all-remaining-v4

### Batch Alpha: Virtualised LayerPanel + Workspace
1. **Virtualised LayerPanel** — Create src/components/LayerPanel.tsx with virtual windowing for 50+ elements; only render visible rows. Show type icon + preview. Click to select. Drag to reorder. Use custom windowing (no react-window dependency). Add to panels.config.tsx.
2. **Custom workspace layouts** — Allow user to save/restore panel arrangements. Create workspaceStore.ts (Zustand + localStorage). Persist panel sizes, positions, visibility.

### Batch Beta: Animation Timeline + WebGPU
3. **Animation timeline UI** — Create src/components/AnimationTimeline.tsx: keyframe editor with playhead, add/remove keyframes for position/rotation/scale/opacity. Add play/pause/stop controls. Integrate with exportWebM to generate animated output from keyframes.
4. **WebGPU compute filters** — Detect WebGPU (navigator.gpu). If available, create a compute pipeline for applying brightness/contrast adjustments on large ImageBitmaps. Implement adjustBrightnessContrastWebGPU(image, brightness, contrast) that returns a new ImageBitmap. Export fallback function that uses Canvas 2D.

### Batch Gamma: Full Translations + Polish
5. **French (fr) translations** — Translate all ~160 English keys in translations.ts to proper French.
6. **Italian (it) translations** — Translate all ~160 English keys in translations.ts to proper Italian.
7. **Stress testing** — Create src/lib/__tests__/stress.test.ts that simulates 100 photos, 500 layers, 4K export to verify memory and performance bounds.

Rules: Execute autonomously, no questions. `npm run lint` must pass before each commit. If Claude Code stalls >5min, skip and move on.