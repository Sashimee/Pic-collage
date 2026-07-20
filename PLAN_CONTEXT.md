# Pic-Collage Context for Plan Generation

## Current Tech Stack (Client-Only)
- React 19 + TypeScript
- Vite 8 + Tailwind v4
- Konva.js (react-konva 19) for canvas rendering
- Zustand for state management
- Framer Motion for animations
- idb (IndexedDB wrapper) for persistence
- vite-plugin-pwa for PWA support
- Playwright + Vitest for testing
- canvas-confetti for celebrations

## Current Features
1. **Canvas Editor**: Layer-based scene graph with Konva (Stage → Layer → Group → nodes)
2. **Element Types**: Photos, Text, Stickers, Drawing (freehand brush)
3. **Photo Editing**: Filters (brightness, contrast, saturation, blur, vignette, presets), shape masks (rect, circle, star, heart, arch, diamond, cloud, hexagon, triangle), cropping
4. **Backgrounds**: Solid, gradient, pattern (dots/stripes/grid/checker/hearts), photo backgrounds
5. **Grid Mode**: Predefined collage layouts with auto-fill cells, zoom/pan per cell
6. **Templates**: 10+ starting templates (2V, 2H, 3Col, 4Grid, Story, PhotoBooth, MoodBoard, Celebration, Comic, Travel, Family, Recipe)
7. **Frames**: None, solid, rounded, polaroid with color/width controls
8. **Text**: Font family, size, color, style, outline, shadow, chip (background), curve
9. **Drawing**: Brush tool with size/color
10. **Export**: PNG/JPG download, Web Share API, .piccollage file save/load
11. **Persistence**: IndexedDB auto-save, projects manager (multiple saved projects)
12. **Undo/Redo**: Full history with coalescing
13. **Selection Bar**: Per-element actions (duplicate, layer reorder, delete)
14. **Layers Panel**: Show/hide, lock/unlock, group/ungroup
15. **Responsive UI**: Desktop (tool rail + side panel) and Mobile (bottom tab bar + bottom sheet)
16. **i18n**: German/English bilingual
17. **Theming**: Dark/light mode toggle
18. **PWA**: Installable, offline-ready
19. **Keyboard Shortcuts**: Undo/redo, delete, escape, etc.

## Known Bug
**Language Switcher Missing on Mobile**: The `LangSwitcher` component (flag buttons 🇩🇪/🇬🇧) is only rendered in the desktop header (`hidden sm:flex` area). The mobile action sheet (hamburger menu) does NOT include a language switcher entry. This must be fixed.

## Data Model
- CanvasElement union: PhotoElement, TextElement, StickerElement, DrawingElement
- Background: solid | gradient | pattern | photo
- Frame: none | solid | rounded | polaroid
- EditorMode: free | grid
- All stored in Zustand, persisted to IndexedDB

## File Structure
```
src/
  main.tsx, App.tsx, index.css, types.ts
  store/ editorStore.ts, projectsStore.ts
  i18n/ translations.ts, useLang.ts, useTheme.ts
  hooks/ useImage.ts, useMediaQuery.ts, useVersionCheck.ts, useShortcuts.ts
  lib/ grids.ts, filters.ts, templates.ts, projectFile.ts, exportImage.ts, importFiles.ts, persistence.ts, perf.ts, batchExport.ts, confetti.ts
  components/
    EditorCanvas.tsx, CanvasNodes.tsx, GridView.tsx
    HeaderBar.tsx, LangSwitcher.tsx, SelectionBar.tsx
    Panels.tsx (BackgroundPanel, DrawPanel, FilterPanel, LayoutPanel, PhotosPanel, StickerPanel, TextPanel)
    Docks.tsx (MobileSheet, MobileTabBar, ToolRail, SidePanel)
    panels.config.tsx
    EmptyState.tsx, Background.tsx, BoardFrame.tsx
    BottomSheet.tsx, ActionSheet.tsx, CropOverlay.tsx
    UpdateBanner.tsx, ErrorBoundary.tsx, ZoomControls.tsx
    ProjectManager.tsx
    ui.tsx (IconButton, Slider, ColorField, Chip, PrimaryButton)
    motion.tsx (framer-motion wrapper)
```

## Requirements for the New Plan
1. **MUST be 100% client-side** — no backend, no server, no cloud sync, no accounts
2. **Complete UX Redesign** — modern, polished, professional, mobile-first where appropriate
3. **Massive New Functionality** — features that genuinely improve the creative experience
4. **Fix the Language Switcher bug** on mobile
5. **Stay within browser capabilities** — Web APIs, WASM, local ML, etc.
6. **Maintain PWA/offline support**
7. **Keep GitHub Pages deployable** (static files only)

## Ideas for New Features (inspiration — not exhaustive)
- AI-powered features via client-side WASM models (background removal, auto-enhance, style transfer)
- Advanced typography (curved text, multi-line text boxes, text-on-path, custom fonts via FontFace API)
- Shape library beyond masks (geometric shapes, arrows, speech bubbles as standalone elements)
- Animation/GIF export (canvas recording to GIF/WebM)
- Better photo editing (healing, clone stamp, perspective correction)
- Layer groups with nested transforms
- Blend modes per layer (multiply, screen, overlay, etc.)
- Grid snapping, alignment guides, rulers
- Copy-paste between projects
- Keyboard-driven workflows
- Contextual right-click menus
- Onboarding tour for first-time users
- Export presets (Instagram post/story, print sizes)
- QR code generation as element type
- SVG import/export
- Color palette extraction from photos
- Smart resize/content-aware scaling
- Collage-to-video ( Ken Burns effect, transitions)
- Photo mosaic mode
- Better drawing (layers, eraser, shape tools, flood fill)
- Search/filter in sticker/emoji picker
- Custom stickers (upload + save)
- Text templates (pre-designed text layouts)
- Background removal with WebGPU/WebGL shaders
- Auto-layout (smart arrangement of photos)
- Face detection for auto-crop to faces
- Collage animation timeline
- Print-ready export (CMYK simulation, bleed marks)
- Better accessibility (ARIA labels, keyboard nav, screen reader)
- Offline-first with conflict-free sync between tabs (BroadcastChannel)
- Version history per project
- Batch operations (apply filters to all photos, bulk resize)
- Pattern/texture backgrounds from uploaded images
- Watermarking
- EXIF data preservation
- Before/after comparison slider
- Split-screen comparison

## Plan Deliverable
A comprehensive PLAN.md file with:
- Executive Summary
- UX Redesign Vision (with specific design direction)
- Architecture decisions for new features
- Detailed phases with tasks, effort estimates, dependencies
- Technology choices for each new capability
- Migration strategy from current codebase
- Testing strategy
- Performance considerations
- Accessibility plan

The plan should be ambitious but achievable within the client-side constraint.
