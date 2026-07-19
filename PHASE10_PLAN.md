# Phase 10: Photo Shape Masks, Smart Layouts & UX Polish

## 1. Photo Shape Cutting (Layout-Integrated)
**Goal:** Let users pick a shape mask (rect, circle, star, heart, rounded, arch, diamond, cloud, hexagon) for each photo directly from the Layout panel.

- Add `shape` field to photo elements (already partially exists)
- Add `ShapePicker` component to Layout panel
- When a photo is selected, show shape buttons
- Update `CanvasNodes.tsx` to apply `clipFunc` for all shapes
- Add new shapes: arch, diamond, cloud, hexagon, triangle

## 2. Global Photo Shape Presets
**Goal:** One-click apply a shape to ALL photos on the board (batch shape).
- Add `applyShapeToAll(shape)` action in editorStore
- Button group in Layout: "Apply to all photos"

## 3. Smart Auto-Arrange
**Goal:** When photos are dropped, auto-layout them in the chosen grid with shape masks.
- On `addPhoto`, if grid mode active, snap photo into next empty grid cell
- Auto-fit photo to cell dimensions
- Respect shape mask

## 4. Touch & Mobile Polish
**Goal:** Make the canvas work great on phones.
- Pinch-to-zoom on canvas (Konva scale)
- Pan canvas with two fingers
- Better touch targets (min 44px)
- Mobile-optimized export sizes

## 5. Keyboard Power-Features
**Goal:** More shortcuts for speed.
- `Ctrl+D` → duplicate selected
- `Ctrl+Shift+]` → bring to front
- `Ctrl+Shift+[` → send to back
- `Ctrl+G` → group selected
- `Ctrl+Shift+G` → ungroup
- Arrow keys → nudge 1px, Shift+Arrow → nudge 10px
- `Ctrl+C / Ctrl+V` → copy/paste elements

## 6. Visual Polish
**Goal:** Make it feel premium.
- Smooth spring animations on photo add/remove (framer-motion on canvas layer)
- Photo hover glow effect
- Better selection outline (animated dashed border via Konva)
- Tooltips on all buttons
- Confetti on export 🎉

## 7. Copy/Paste Elements
**Goal:** Standard copy/paste for elements.
- Serialize element to JSON on copy
- Deserialize and add on paste with offset (+20px)
- Clipboard API with fallback

## 8. Canvas Zoom & Pan
**Goal:** Work on large canvases comfortably.
- Zoom slider (50%–200%)
- Reset zoom button
- Pan mode (space+drag or middle mouse)
- Mini-map in corner

## Execution Order
1. Write shape definitions (arch, diamond, cloud, hexagon, triangle)
2. Update `CanvasNodes.tsx` to support all shapes via clipFunc
3. Add ShapePicker to Layout panel
4. Add `applyShapeToAll` store action
5. Implement copy/paste in `useShortcuts.ts`
6. Add arrow-key nudging
7. Add canvas zoom controls
8. Polish: tooltips, animations, confetti
9. Build, test, lint, deploy
