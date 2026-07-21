# Claude Code Instructions — Pic-Collage v5 Remaining Tasks

Execute ALL remaining unimplemented features. Do NOT ask the user anything. Commit after each feature. Push to origin main when done.

## Context
- Branch: main (already merged from phase-all-remaining-v5)
- Stack: React 19 + TypeScript + Vite 8 + Tailwind v4 + Konva.js + Zustand
- Working dir: /home/alex/projects/Pic-collage
- Lint command: `npm run lint` (must pass before every commit)
- Build command: `npm run build` (must pass before push)

## Remaining Tasks (in priority order)

### 1. Wire AI modules to UI
The following modules exist but have NO UI buttons:
- `src/ai/portraitRetouch.ts` → Add "Retouch" button to SelectionBar when photo selected. Open panel with skin/eyes/teeth sliders.
- `src/ai/healTool.ts` → Add "Heal" mode to DrawPanel. Alt+click for source, then paint.
- `src/ai/styleTransfer.ts` → Add "Styles" section to FilterPanel with Oil Painting / Sketch / Pop Art buttons.
- `src/ai/textSuggestions.ts` → Add suggestion chips to TextPanel. Detect photos, show contextual captions.
- `src/ai/autoEnhance.ts` → Already wired to FilterPanel Sparkles button — verify it works.
- `src/ai/faceDetection.ts` → Wire to smart crop and portrait retouch.
- `src/ai/bgRemoval.ts` → Add "Remove Background" button to SelectionBar for photos.

### 2. Ken Burns Effect
- Add `kenBurns?: boolean` to PhotoElement in types.ts
- Add Ken Burns checkbox to SelectionBar when photo selected
- In AnimationTimeline, when Ken Burns is enabled, auto-generate start/end keyframes with slight pan (±20px) and zoom (±0.1) variations
- Wire into exportWebM in exportAnimation.ts

### 3. Batch Export
- Install JSZip: `npm install jszip` (or check if already installed)
- Create `src/lib/batchExport.ts`: export multiple formats+sizes, package as ZIP
- Add "Batch Export" option to HeaderBar export dropdown with format/size checkboxes
- Wire into App.tsx handleExport

### 4. Social Share Optimisation
- Create `src/lib/socialExport.ts`: Platform limits (Instagram 8MB, Twitter 5MB, Pinterest 10MB)
- Implement `exportForPlatform(platform)` that adjusts canvas quality/compression
- Add platform selector to export dropdown (Instagram/Twitter/Pinterest/Original)

### 5. Workspace Layout Presets
- Extend `src/store/workspaceStore.ts`: add preset names ("Editing", "Review", "Minimal")
- Add preset buttons to SettingsPanel
- "Editing" = all panels visible
- "Review" = canvas maximized, minimal panels
- "Minimal" = just canvas + toolbar

### 6. Bézier Pen Tool
- Add element type `path` with SVG path string `d` to types.ts
- Create PathPanel (strokeWidth, stroke, fill, closePath)
- In EditorCanvas, add pen mode: click to place anchor points, drag for handles
- Render with Konva.Path in CanvasNodes.tsx

### 7. Drawing Blend Modes
- Verify DrawingElement has `blendMode` and `opacity`
- In DrawPanel, add blend mode dropdown and opacity slider
- In CanvasNodes.tsx DrawingNode, apply `globalCompositeOperation`

### 8. Shape Library Categories
- Expand shapes in Panels.tsx Shape section: Basic, Arrows, Decorative tabs
- Use existing shape types + add heart, cloud, lightning bolt

### 9. Clipboard Integration
- Wire `src/lib/clipboard.ts` into App.tsx
- Ctrl+C = copy selected element(s) to JSON clipboard store
- Ctrl+V = paste with 40px offset
- Add "Copy Image" button to SelectionBar (navigator.clipboard.write with Blob)
- Handle paste of image files from system clipboard

### 10. Context Menus
- Wire `src/hooks/useContextMenu.ts` into App.tsx
- Right-click canvas: Cut/Copy/Paste/Delete/Duplicate/Bring Front/Send Back
- Right-click layer in LayerPanel: Rename/Duplicate/Delete

### 11. Touch Gestures
- Three-finger tap = undo
- Two-finger rotate = rotate selected element
- Edge-swipe left = toggle side panel
- Edge-swipe right = toggle layer panel
- Add to EditorCanvas.tsx

### 12. Bundle Analysis
- Install: `npm install -D rollup-plugin-visualizer`
- Add `npm run analyze` script to package.json
- Run once, report largest chunks

### 13. Service Worker Tuning
- Review vite.config.ts PWA config
- Ensure only shell is precached
- Panels + WASM should be lazy-cached

## Rules
1. Execute autonomously. NO user questions.
2. After each feature: `npm run lint` → commit with conventional message
3. If a feature is too complex, break it into smaller commits
4. Focus on wiring existing modules to UI first (highest impact)
5. Don't worry about perfection — get features working and wired
6. Push to origin main when all done