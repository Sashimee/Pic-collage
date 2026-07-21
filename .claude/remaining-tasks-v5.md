# Remaining Tasks V5 — Complete Execution Plan

Execute ALL remaining tasks from PLAN.md. Do NOT ask user anything. Commit after each feature. Push when done.

## Branch: phase-all-remaining-v5

### Batch A: Advanced Typography
1. **Rich text editing** — Inline bold/italic/underline within text boxes. TextElement gains `spans: TextSpan[]`. Each span has text, bold, italic, underline, fontSize, fill. Update TextNode in CanvasNodes.tsx to render spans. Update TextPanel with B/I/U toggles.
2. **Text-on-path** — Curved text along SVG path. Add `path?: string` to TextElement. TextPanel: add arch/circle/wave buttons. CanvasNodes: render text along bezier path using Konva.TextPath or custom letter placement.
3. **Text effects** — Neon glow (text-shadow), 3D extrude (multiple offset layers), gradient fill per character. Add `effects?: TextEffect[]` to TextElement. TextPanel: effect toggles.
4. **Text templates** — Pre-designed layouts (heading+subheading, quote card, price tag). Add "Templates" section to TextPanel with 6 presets.

### Batch B: Drawing, Shapes & Templates
5. **Bézier pen tool** — Freeform vector paths. New `path` element type with SVG path data. Drawing mode: click to place anchor points, drag for bezier handles. Double-click to close. PathPanel for stroke/fill.
6. **Drawing layers upgrade** — DrawingElement gains `blendMode` and `opacity`. Add blend mode dropdown (normal/multiply/screen/overlay/darken/lighten). Add eraser mode toggle in DrawPanel.
7. **Shape library categories** — Expand shape gallery with arrows, badges, decorative categories. ShapePanel with tabs (Basic / Arrows / Decorative).
8. **Smart template suggestions** — After uploading N photos, suggest layouts matching count + aspect ratios. Show "Smart Suggest" button in LayoutPanel.

### Batch C: AI & Intelligence
9. **Portrait retouch** — Skin smoothing, teeth whitening, eye brightening via canvas pixel manipulation. Add "Retouch" panel with sliders. Auto-detect face landmarks (face-api.js) and apply effects to regions.
10. **Object removal / inpainting** — User paints over unwanted object; AI fills background. Simplified: use canvas clone-stamp (copy from nearby pixels) for basic removal. Add "Heal" tool to drawing toolbar.
11. **Style transfer** — Apply artistic styles (oil painting, sketch, pop art). Use CSS filters + canvas convolution kernels for simplified artistic effects. Add style buttons to Filters panel.
12. **AI text suggestions** — Contextual captions from photo content. Simplified: use object detection labels (pre-trained MobileNet via TensorFlow.js or simpler: analyze color histogram + face presence → generate generic captions like "Summer vibes" / "Family memories" / "Nature escape"). Show suggestions in TextPanel.

### Batch D: Animation & Export
13. **Transition presets** — Fade, slide, zoom, flip between scenes in animation timeline. Add transition selector to AnimationTimeline between keyframes.
14. **Ken Burns effect** — Slow pan/zoom on still photos. Add "Ken Burns" checkbox to PhotoElement; auto-generate position/scale keyframes on export.
15. **Batch export** — Export multiple sizes at once. Add "Batch Export" option in export dropdown with checkboxes for formats (PNG/JPG/SVG) and sizes (original/1080p/720p).
16. **Social share optimisations** — Auto-compress to platform limits. Add platform selector (Instagram 8MB, Twitter 5MB, etc.) that adjusts quality.
17. **Workspace layout recall** — "Editing", "Review", "Minimal" presets. Save/restore panel arrangements in workspaceStore.

### Batch E: Performance & Polish
18. **Context menus** — Wire useContextMenu hook. Right-click on canvas: cut/copy/paste/delete. Right-click on layer: rename/duplicate/delete. Desktop only.
19. **Clipboard integration** — Wire clipboard.ts. Copy selected elements (Ctrl+C), paste (Ctrl+V) between projects. Copy image to system clipboard.
20. **Touch gesture refinement** — Three-finger tap for undo, two-finger rotate for selected element, edge-swipe for panels. Add touch gesture handler to EditorCanvas.

Rules: Execute autonomously, no questions. `npm run lint` must pass before each commit. If Claude Code stalls >5min, skip and move on.