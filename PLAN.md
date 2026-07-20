# Pic-Collage: Massive Transformation Plan

> **Goal:** Transform Pic-Collage from a capable hobby project into a **professional-grade, client-side creative tool** that rivals native apps in feel and feature depth — all while remaining 100 % browser-hosted, installable as a PWA, and deployable to GitHub Pages.

---

## 1. Executive Summary

Pic-Collage already has a solid foundation: React 19, Konva canvas, Zustand state, IndexedDB persistence, PWA support, bilingual i18n, and a responsive shell. The next evolution is not incremental polish — it is a **leap to professional creative-tool status**.

This plan reimagines the app with:
- A **complete UX redesign** (modern spatial interface, gesture-driven interactions, dark/light harmony)
- **New creative superpowers** (AI background removal, smart templates, animation, advanced typography)
- **Workflow enhancements** (keyboard-driven editing, context menus, alignment guides, version history)
- **Performance & reliability** (offscreen rendering, virtualised layers, WASM acceleration)
- **Accessibility-first design** (WCAG 2.2 AA, full keyboard navigation, screen-reader support)

Everything stays **client-side only**. No servers, no accounts, no cloud.

---

## 2. Current State Assessment

### What's Working Well
| Area | Assessment |
|------|-----------|
| Architecture | Clean layer-based canvas with Konva; React 19 + TypeScript is modern |
| State | Zustand store with undo/redo, clear action pattern |
| Persistence | IndexedDB with photo blob storage; `.piccollage` file export/import |
| Responsive | Desktop tool-rail + side panel; mobile tab bar + bottom sheet |
| PWA | Works offline, installable, service-worker update banner |
| i18n | Bilingual DE/EN with full translation coverage |
| Theming | Dark/light CSS-variable system with Tailwind v4 |
| Drawing | Freehand brush tool with size/colour controls |

### Pain Points & Gaps
| # | Issue | Impact |
|---|-------|--------|
| 1 | **Language switcher missing on mobile** — only in desktop header | DE users on iPhone cannot switch language |
| 2 | UI feels "app-like" but not "pro-tool-like" — lacks spatial depth, refined micro-interactions | Users perceive it as a toy, not a tool |
| 3 | No alignment guides, snapping, or grid — free-form placement only | Hard to make polished, balanced layouts |
| 4 | Text editing is primitive — single-line, no rich formatting, no text box | Cannot do paragraphs, bullet lists, or styled captions |
| 5 | No shape/vector elements beyond photo masks | Cannot add arrows, speech bubbles, dividers |
| 6 | No animation or motion export | Cannot create Stories, Reels, or animated GIFs |
| 7 | No AI-assisted editing (background removal, auto-enhance, smart crop) | Manual cropping is tedious |
| 8 | Keyboard shortcuts are minimal | Power users are slowed down |
| 9 | No layer groups with nested transforms | Complex collages become unmanageable |
| 10 | Bundle size is unoptimised; no code-splitting per panel | Slow first load on mobile networks |
| 11 | Accessibility gaps — no focus rings, skip links, or ARIA landmarks | Screen-reader users and keyboard-only users are blocked |
| 12 | No export presets (Instagram, Story, Print) | Users must manually know pixel dimensions |

---

## 3. UX Redesign Vision

### 3.1 Design Philosophy: "Liquid Canvas"

The new UI follows a **Liquid Canvas** metaphor: the workspace is fluid, the chrome is minimal, and the tools materialise exactly where and when you need them.

- **No persistent heavy chrome** — the header shrinks to a slim floating bar; panels are translucent and dockable
- **Contextual tools** — selection shows a floating radial menu (desktop) or a bottom quick-bar (mobile)
- **Gesture-first** — pinch-to-zoom, two-finger rotate, long-press for context menus, swipe for layer reorder
- **Depth through glass** — frosted-glass panels with subtle backdrop blur, not solid blocks
- **Motion as feedback** — every action has a micro-animation (spring physics, not linear)

### 3.2 Visual Language Evolution

| Token | Current | New |
|-------|---------|-----|
| Surfaces | Flat solid `#131a2e` | Layered glass: `rgba(15,20,40,0.85)` + `backdrop-blur(20px)` |
| Accent | Gradient purple→pink | Broader palette: accent adapts to project theme; still gradient-capable |
| Shadows | Heavy dark | Soft ambient + sharp directional |
| Typography | System UI | Inter (variable) for UI; custom FontFace API for creative text |
| Rounding | `rounded-xl` everywhere | Adaptive: tighter for controls (`rounded-lg`), more generous for cards (`rounded-2xl`) |
| Icons | Lucide only | Lucide + custom SVG icons for tool-specific actions |

### 3.3 Layout Paradigm

**Desktop:**
- Slim **floating header** (40px, auto-hides on scroll-down, reappears on scroll-up or mouse-near-top)
- **Left tool rail** (64px, icon-only, collapses to 48px on hover)
- **Right properties panel** (280px, auto-width, can be collapsed to a floating pill)
- **Bottom status bar** (zoom %, canvas size, selected element info, quick toggles)
- **Centre canvas** maximised with subtle dot-grid background (toggleable)

**Mobile:**
- **Top floating pill** (brand + undo/redo + export, collapses to a dot)
- **Bottom quick-actions bar** (contextual: changes based on selection)
- **Side-swipable panels** (not bottom sheet — full-screen overlay with swipe-to-dismiss)
- **Gesture hints** on first use (coach marks, not tours)

### 3.4 Specific UI/UX Improvements

1. **Floating Selection Ring** — replace the linear SelectionBar with a radial/contextual menu that appears around the selected element (desktop: 8-position ring; mobile: bottom quick-actions)
2. **Alignment Guides** — smart snapping lines (horizontal/vertical centre, edges, equal spacing) appear as you drag; hold `Shift` to disable snapping
3. **Rulers & Guides** — optional pixel rulers on canvas edges; user can drag out custom guide lines
4. **Canvas Background Grid** — dot grid / line grid / dark / light / image background for the workspace (not the collage background)
5. **Zoom Overview** — mini-map in corner showing full canvas with viewport rectangle; click to pan
6. **Improved Empty State** — animated illustration, clearer CTA, "open recent" quick list
7. **Onboarding Flow** — 3-step interactive intro (add photo → add text → export) with skip option
8. **Toast Notifications** — replace `window.alert` with polished toast stack (success/error/info)
9. **Recent Files** — list of recently opened `.piccollage` files in empty state and File menu
10. **Keyboard Cheat Sheet** — `?` key opens a modal with all shortcuts

---

## 4. Architecture Evolution

### 4.1 State Management Refactor

Current Zustand store is monolithic. Split into domain stores with cross-store subscriptions:

```
store/
  editorStore.ts      → Canvas content (elements, background, frame)
  historyStore.ts     → Undo/redo (now service-agnostic, can replay across stores)
  uiStore.ts          → UI state (panels, selection, zoom, theme, language)
  projectsStore.ts    → Saved projects (metadata only, lazy-load content)
  assetsStore.ts      → Photo blobs, custom fonts, stickers, textures
  settingsStore.ts    → User preferences (snap, grid, autosave interval, shortcuts)
  keyboardStore.ts    → Active modifiers (Shift, Alt, Ctrl) for gesture combos
```

**Why:** Smaller stores = better tree-shaking, selective persistence, and easier testing.

### 4.2 Canvas Engine Upgrades

| Current | Upgrade |
|---------|---------|
| Single Konva Layer | Multiple Layers: Background, Content, Overlay (guides, selection), UI (handles) |
| Immediate-mode rendering | **Offscreen canvas caching** — each static element renders once to an offscreen canvas; only dynamic elements redraw |
| No hit-region optimisation | **Spatial hash grid** for fast hit-testing on large projects (100+ elements) |
| Fixed pixel-ratio export | **Adaptive quality** — user chooses export DPI (72, 150, 300) |

### 4.3 Module Organisation

```
src/
  engine/          ← NEW: canvas engine abstraction
    renderer.ts
    cache.ts
    hitTest.ts
    guides.ts
  ai/              ← NEW: client-side AI modules
    bgRemoval.ts
    autoEnhance.ts
    smartCrop.ts
    colorExtract.ts
  features/
    animation/     ← NEW: timeline, keyframes, GIF/WebM export
    typography/    ← NEW: text engine, font loading, text-on-path
    shapes/        ← NEW: vector shapes, paths, arrows
    templates/     ← Enhanced: smart templates with AI suggestions
  stores/          ← Refactored: domain stores
  components/
    chrome/        ← Header, footer, floating bars
    canvas/        ← EditorCanvas, GridView, Background
    panels/        ← One file per panel, lazy-loaded
    overlays/      ← Toasts, tooltips, coach marks, context menus
    primitives/    ← ui.tsx expanded: Button, Slider, ColorPicker, SegmentedControl, etc.
  hooks/
    useGesture.ts      ← NEW: unified gesture hook (pinch, pan, rotate)
    useSnap.ts         ← NEW: alignment snapping logic
    useKeyboard.ts     ← NEW: global shortcut manager
    useOffscreen.ts    ← NEW: offscreen canvas lifecycle
    useWasm.ts         ← NEW: WASM module lazy loading
  lib/
    export/        ← NEW: export strategies (PNG, JPG, GIF, WebM, SVG, PDF)
    fonts.ts       ← NEW: FontFace API manager
    color.ts       ← NEW: color manipulation (oklch, contrast, palette)
    math.ts        ← NEW: geometry helpers (intersection, distance, bezier)
```

### 4.4 Plugin System (Lightweight)

Introduce a **Plugin API** so advanced features can be loaded on demand:

```ts
interface Plugin {
  id: string
  name: string
  version: string
  activate: (api: PluginApi) => void
  deactivate: () => void
}

// PluginApi exposes:
// - registerPanel(tabId, component)
// - registerTool(toolId, cursor, handler)
// - registerExportFormat(format, exporter)
// - registerElementType(type, renderer)
// - registerShortcut(keyCombo, action)
```

Plugins are **dynamic imports** loaded when the user first accesses the feature. This keeps the initial bundle small.

---

## 5. Feature Roadmap

### Phase 1: Foundation & UX Redesign (Weeks 1–4)
**Goal:** Fix bugs, redesign the shell, establish new architecture, add accessibility baseline.

| Task | Detail | Effort |
|------|--------|--------|
| **P1.1 Fix LangSwitcher on mobile** | Add language toggle to mobile ActionSheet in HeaderBar.tsx | ½ day |
| **P1.2 Split monolithic store** | Refactor into domain stores (editor, ui, projects, assets, settings) | 3 days |
| **P1.3 Redesign desktop chrome** | Floating header, collapsible side panel, status bar, glass surfaces | 4 days |
| **P1.4 Redesign mobile chrome** | Floating top pill, contextual bottom quick-bar, swipeable panels | 4 days |
| **P1.5 Accessibility baseline** | Add focus rings, ARIA landmarks, keyboard navigation, skip links | 3 days |
| **P1.6 Toast system** | Replace all alerts with toast notifications | 1 day |
| **P1.7 Onboarding flow** | 3-step interactive intro with coach marks | 2 days |
| **P1.8 Keyboard shortcuts** | Global shortcut manager; undo/redo, delete, duplicate, zoom, select-all, nudge | 2 days |
| **P1.9 Export presets** | Instagram Post (1080×1080), Story (1080×1920), Reel (1080×1920), Pinterest (1000×1500), A4 Print (2480×3508), Custom | 2 days |
| **P1.10 Code-split panels** | Dynamic `React.lazy()` for each panel; reduce initial bundle by ~40 % | 2 days |

**Phase 1 Deliverables:** New shell, working accessibility, smaller bundle, mobile language fix.

---

### Phase 2: Creative Power-Up (Weeks 5–10)
**Goal:** Add professional-grade creative tools.

#### 2a. Advanced Typography
| Task | Detail | Effort |
|------|--------|--------|
| **P2.1 Multi-line text boxes** | TextElement gains `width` and `lineHeight`; Konva Text with wrapping | 2 days |
| **P2.2 Rich text editing** | Inline bold/italic/underline, font size mixing within one text box (simplified rich-text: spans) | 4 days |
| **P2.3 Text-on-path** | Curved text along SVG path (arches, circles, waves) | 3 days |
| **P2.4 Custom fonts** | FontFace API integration; load TTF/OTF/WOFF from user files; store in IndexedDB | 3 days |
| **P2.5 Text templates** | Pre-designed text layouts (heading + subheading, quote card, price tag) | 2 days |
| **P2.6 Text effects** | Neon glow, 3D extrude, gradient fill per character | 3 days |

#### 2b. Vector Shapes & Drawing Upgrade
| Task | Detail | Effort |
|------|--------|--------|
| **P2.7 Shape element type** | Rect, circle, triangle, star, arrow, speech bubble, heart as standalone elements | 3 days |
| **P2.8 Path tool** | Bézier pen tool for freeform vector paths | 4 days |
| **P2.9 Drawing layers** | DrawingElement gains `blendMode`, `opacity`; eraser mode | 2 days |
| **P2.10 Shape library panel** | Categorised shape gallery (basic, arrows, badges, decorative) | 2 days |

#### 2c. Photo Editing Enhancements
| Task | Detail | Effort |
|------|--------|--------|
| **P2.11 Alignment guides & snapping** | Smart snap to edges, centres, equal spacing; visual guides; `Shift` to disable | 3 days |
| **P2.12 Grid & rulers** | Toggleable pixel grid, custom guide lines, snap-to-grid | 2 days |
| **P2.13 Layer groups** | GroupElement with nested transforms; group select, group reorder | 3 days |
| **P2.14 Bulk operations** | "Apply filter to all photos", "Select all photos", "Distribute evenly" | 2 days |
| **P2.15 Advanced filters** | Hue shift, exposure, shadows/highlights, temperature/tint, clarity | 3 days |
| **P2.16 Filter history per photo** | Non-destructive filter stack (list of applied filters, reorderable, toggleable) | 4 days |
| **P2.17 Perspective correction** | 4-point perspective transform on photos | 3 days |
| **P2.18 Clone stamp / healing** | Basic clone tool for blemish removal | 4 days |

#### 2d. Template Intelligence
| Task | Detail | Effort |
|------|--------|--------|
| **P2.19 Smart template suggestions** | After uploading N photos, suggest layouts that fit the count and aspect ratios | 3 days |
| **P2.20 Template categories** | Social, Print, Mood, Celebration, Seasonal (with live previews) | 2 days |
| **P2.21 User-defined templates** | Save current layout as a reusable template | 1 day |

**Phase 2 Deliverables:** Professional typography, vector shapes, smart guides, non-destructive filters, templates.

---

### Phase 3: Intelligence & Automation (Weeks 11–16)
**Goal:** Client-side AI features that feel like magic.

All AI runs **in the browser** via WASM/WebGPU. No API calls. No servers.

| Task | Detail | Technology | Effort |
|------|--------|-----------|--------|
| **P3.1 Background removal** | Remove/replace photo backgrounds automatically | ONNX Runtime Web + U²Net or RMBG-2-Studio model (WASM) | 5 days |
| **P3.2 Auto-enhance** | One-tap brightness/contrast/saturation optimisation | WebGL histogram analysis + curve adjustment | 2 days |
| **P3.3 Smart crop** | Auto-crop to subject using saliency detection | Tiny saliency model (~1MB) via ONNX.js | 3 days |
| **P3.4 Face detection & auto-focus** | Detect faces in photos; auto-zoom crop to face group | face-api.js (tiny model, client-side) | 3 days |
| **P3.5 Color palette extraction** | Extract dominant colours from a photo for background/text suggestions | K-means clustering in Web Worker | 2 days |
| **P3.6 Style transfer** | Apply artistic styles (oil painting, sketch, pop art) to photos | ONNX style-transfer model | 4 days |
| **P3.7 Auto-layout** | Given N photos, automatically arrange them in a balanced free-form collage | Greedy rectangle-packing algorithm | 3 days |
| **P3.8 AI text suggestions** | Contextual caption suggestions based on photo content (object detection) | Lightweight MobileNet classifier | 3 days |
| **P3.9 Portrait retouch** | Skin smoothing, teeth whitening, eye brightening (subtle, adjustable) | WebGL shaders + face landmarks | 4 days |
| **P3.10 Object removal** | Paint over unwanted object; AI inpaints the background | LaMa inpainting model (ONNX) | 5 days |
| **P3.11 WASM module manager** | Lazy-load ONNX models on first use; cache in IndexedDB; show progress | Custom loader with progress events | 3 days |
| **P3.12 WebGPU acceleration** | Use WebGPU compute shaders for heavy image ops where available | Fallback to WebGL 2 | 3 days |

**Phase 2 Deliverables:** AI background removal, smart crop, face detection, colour extraction, style transfer, auto-layout.

---

### Phase 4: Export, Animation & Motion (Weeks 17–22)
**Goal:** Go beyond static images — motion, video, and advanced export.

| Task | Detail | Technology | Effort |
|------|--------|-----------|--------|
| **P4.1 Animated GIF export** | Export collage as animated GIF (element entrance animations, Ken Burns) | gif.js or omggif (client-side) | 4 days |
| **P4.2 WebM / MP4 export** | Export as short video with transitions and music | MediaRecorder API + Web Audio | 5 days |
| **P4.3 Animation timeline** | Keyframe-based timeline panel: position, rotation, scale, opacity per element | Custom timeline UI + requestAnimationFrame | 5 days |
| **P4.4 Transition presets** | Fade, slide, zoom, flip, spin between scenes | CSS/WebGL transitions | 3 days |
| **P4.5 Ken Burns effect** | Slow pan/zoom on still photos for cinematic feel | Smooth interpolation in export | 2 days |
| **P4.6 SVG export** | Export text and shapes as true SVG (vectors preserved) | Canvas-to-SVG path extraction | 3 days |
| **P4.7 PDF export** | Multi-page PDF for photo books or print-ready documents | pdf-lib.js | 3 days |
| **P4.8 Print-ready mode** | CMYK colour simulation, bleed marks, crop marks, safe-zone overlay | CSS filters + overlay guides | 2 days |
| **P4.9 Batch export** | Export multiple projects or multiple sizes at once | Zip generation via JSZip | 2 days |
| **P4.10 EXIF preservation** | Keep original photo metadata in exported files | piexif.js | 1 day |
| **P4.11 Watermarking** | Add text or image watermark with opacity/position controls | Overlay element at export time | 1 day |
| **P4.12 Social share optimisations** | Auto-compress to platform limits (e.g., Instagram 8MB), format selection | Canvas quality tuning | 2 days |

**Phase 4 Deliverables:** GIF/WebM export, animation timeline, SVG/PDF export, print-ready mode.

---

### Phase 5: Polish, Performance & Scale (Weeks 23–28)
**Goal:** Make the app feel like a native professional tool.

| Task | Detail | Effort |
|------|--------|--------|
| **P5.1 Offscreen canvas caching** | Static elements render to offscreen canvas; only dynamic content redraws | 4 days |
| **P5.2 Virtualised layer list** | For projects with 50+ layers, virtualise the layer panel | 2 days |
| **P5.3 Image pyramid** | Store multiple resolutions of each photo; use appropriate resolution for viewport | 3 days |
| **P5.4 Memory pressure handling** | Monitor `performance.memory`; unload unseen photo blobs; warn on low memory | 2 days |
| **P5.5 Bundle analysis & tree-shaking** | Analyse with `vite-bundle-visualizer`; remove dead code | 2 days |
| **P5.6 Service worker precache tuning** | Precache only shell; lazy-cache panels and WASM models | 2 days |
| **P5.7 Version history per project** | Save snapshots every N minutes; browse and restore older versions | 3 days |
| **P5.8 Cross-tab sync** | BroadcastChannel API: changes in one tab reflect in another instantly | 2 days |
| **P5.9 Right-click context menus** | Desktop: context menu on canvas, layers, elements | 2 days |
| **P5.10 Drag & drop from desktop** | Drop images directly onto canvas from file manager | 1 day |
| **P5.11 Clipboard integration** | Copy/paste elements between projects; copy image to system clipboard | 2 days |
| **P5.12 Full-screen mode** | Distraction-free editing; hide all chrome, show canvas edge-to-edge | 1 day |
| **P5.13 Custom workspace layouts** | Save panel arrangements; recall layouts ("Editing", "Review", "Minimal") | 2 days |
| **P5.14 Performance benchmarks** | Automated FPS, memory, load-time benchmarks in CI | 2 days |
| **P5.15 Stress testing** | 100-photo collage, 500-layer project, 4K export | 2 days |
| **P5.16 Internationalisation expansion** | Add Spanish, French, Italian (community-driven; structure ready) | 3 days |
| **P5.17 Dark/light auto-detect** | Respect `prefers-color-scheme` by default | ½ day |
| **P5.18 Touch gesture refinement** | Three-finger undo, two-finger rotate, edge-swipe for panels | 2 days |

**Phase 5 Deliverables:** Native-level performance, version history, cross-tab sync, context menus, clipboard, full-screen.

---

## 6. Technology Choices

| Capability | Choice | Reason |
|-----------|--------|--------|
| **AI / ML** | ONNX Runtime Web + custom WASM models | Runs entirely in browser; no server |
| **WebGPU compute** | Raw WebGPU API (with WebGL 2 fallback) | Image processing acceleration; falls back gracefully |
| **Animation export** | MediaRecorder API + Canvas captureStream | Native browser API, no library needed for video |
| **GIF export** | gif.js (or omggif) | Client-side GIF encoding |
| **PDF export** | pdf-lib.js | Pure client-side PDF generation |
| **SVG export** | Custom path extraction from Konva | Keep vectors vector |
| **Font loading** | FontFace API + IndexedDB cache | No external font CDNs; user uploads persist |
| **Colour math** | culori (tree-shakeable) | oklch, contrast, palette generation |
| **Image pyramids** | canvas drawImage scaling | Native, zero dependencies |
| **Zip export** | JSZip | Batch export packaging |
| **EXIF** | piexif.js | Read/write EXIF in JPEG |
| **Face detection** | face-api.js (tiny model) | Proven, client-side, ~300KB |
| **Gesture handling** | Custom hook + Pointer Events | More control than libraries; native support is good |
| **Virtualisation** | Custom windowing for layer list | Only ~20 DOM nodes regardless of layer count |
| **WASM loader** | Custom lazy loader with IndexedDB cache | Models are large; must not re-download |

---

## 7. Data Model Evolution

### 7.1 New Element Types

```ts
// Existing: photo | text | sticker | drawing
// New:
type ElementType = 'photo' | 'text' | 'sticker' | 'drawing' | 'shape' | 'group'

interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeType: 'rect' | 'circle' | 'triangle' | 'arrow' | 'speech-bubble' | 'star' | 'custom'
  fill: string
  stroke?: string
  strokeWidth?: number
  // For custom: SVG path string
  path?: string
  // For arrow: head size, tail style
  arrowHead?: { size: number; style: 'triangle' | 'circle' | 'bar' }
}

interface GroupElement extends BaseElement {
  type: 'group'
  children: CanvasElement[]  // nested elements
  expanded?: boolean        // layer panel state
}

// TextElement expands:
interface TextElement extends BaseElement {
  // ...existing fields...
  width?: number             // multi-line wrapping width
  lineHeight?: number       // 1.2 default
  align?: 'left' | 'center' | 'right'
  textTransform?: 'none' | 'uppercase' | 'lowercase'
  // Rich text: array of spans
  spans?: TextSpan[]
}

interface TextSpan {
  text: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fill?: string
}
```

### 7.2 Non-Destructive Filters

```ts
interface PhotoElement extends BaseElement {
  // ...existing fields...
  filterStack: FilterOperation[]  // replaces single filters object
}

type FilterOperation =
  | { type: 'brightness'; value: number }
  | { type: 'contrast'; value: number }
  | { type: 'saturation'; value: number }
  | { type: 'hueShift'; value: number }
  | { type: 'exposure'; value: number }
  | { type: 'shadows'; value: number }
  | { type: 'highlights'; value: number }
  | { type: 'temperature'; value: number }
  | { type: 'tint'; value: number }
  | { type: 'clarity'; value: number }
  | { type: 'preset'; id: FilterPreset }
  | { type: 'blur'; radius: number }
  | { type: 'vignette'; strength: number }
  | { type: 'aiBgRemoval'; enabled: boolean; replacementColor?: string }
  | { type: 'styleTransfer'; styleId: string; intensity: number }
```

### 7.3 Animation Keyframes

```ts
interface AnimationTrack {
  elementId: string
  keyframes: Keyframe[]
}

interface Keyframe {
  time: number  // seconds from start
  properties: {
    x?: number
    y?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
  }
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring'
}

interface ProjectAnimation {
  duration: number
  tracks: AnimationTrack[]
  transitions: Transition[]
}
```

### 7.4 Settings Store

```ts
interface UserSettings {
  snapToGuides: boolean
  snapToGrid: boolean
  gridSize: number
  gridType: 'none' | 'dots' | 'lines'
  showRulers: boolean
  showZoomOverview: boolean
  autosaveInterval: number  // seconds
  exportDpi: 72 | 150 | 300
  defaultAspectRatio: string
  defaultFilter: FilterPreset
  defaultFont: string
  keyboardShortcuts: Record<string, string>
  workspaceLayout: 'default' | 'minimal' | 'fullScreen'
}
```

---

## 8. Migration Strategy

### 8.1 Backward Compatibility

1. **Versioned project schema** — every `.piccollage` file includes `schemaVersion: 2`
2. **Migration layer** — on load, detect `schemaVersion: 1` and auto-migrate:
   - `filters` object → `filterStack` array with single entries
   - Missing fields get sensible defaults
   - Old `PhotoElement` without `photoId` gets a generated one
3. **Graceful degradation** — if a feature (e.g., WASM model) fails to load, disable that feature with a tooltip explanation

### 8.2 Incremental Rollout

| Step | Action |
|------|--------|
| 1 | Create `v2` branch off `dev` |
| 2 | Phase 1 (shell + fixes) lands on `v2` |
| 3 | Tag `v1.legacy` before merging any breaking changes |
| 4 | Each phase is a PR; merge when stable |
| 5 | After Phase 3, run parallel beta: deploy `v2` to `gh-pages` under `/beta/` path |
| 6 | Gather feedback, fix issues, then promote `v2` → `main` |
| 7 | Keep `v1.legacy` branch for emergency rollback |

### 8.3 Data Migration

- **IndexedDB**: Add a migration transaction that reads old stores and writes new schema
- **Projects**: Old projects open seamlessly via migration layer
- **Custom assets**: Fonts and stickers stored in new `assetsStore` with backward-compatible IDs

---

## 9. Testing & Quality

### 9.1 Testing Pyramid

| Layer | Tool | Coverage Target | What |
|-------|------|-----------------|------|
| Unit | Vitest | 80 % | Store actions, pure utilities (math, colour, filters), export logic |
| Integration | Vitest + jsdom | 60 % | Panel rendering, canvas interaction simulation, file import/export |
| E2E | Playwright | Core flows | Upload → edit → export (all formats), undo/redo, persistence |
| Visual | Playwright + pixelmatch | Key screens | Empty state, editor with elements, export result comparison |
| Performance | Lighthouse CI + custom | Metrics | First Contentful Paint < 1.5s, Time to Interactive < 3s |
| Accessibility | axe-core + Lighthouse | WCAG 2.2 AA | Automated a11y scan on every PR |

### 9.2 Specific Test Suites

1. **Canvas rendering regression** — fixed set of 5 reference collages; export PNG and diff against golden images
2. **Undo/redo stress** — 100 random operations, verify state consistency
3. **Memory leak** — open/close 50 photos, verify no blob URL leaks
4. **Mobile gesture** — Playwright touch emulation for pinch, pan, long-press
5. **PWA offline** — Service worker caches shell; app works without network
6. **i18n completeness** — Every translation key has both DE and EN

### 9.3 Quality Gates (per PR)

- TypeScript strict mode: zero errors
- ESLint: zero errors
- Vitest: all unit tests pass
- Playwright smoke: 3 core flows pass
- Bundle size: `< 500 KB` initial (gzipped)

---

## 10. Performance Plan

### 10.1 Bundle Budgets

| Chunk | Target Size |
|-------|-------------|
| Initial shell (React, router, stores, chrome) | < 200 KB gzipped |
| Canvas engine (Konva, gesture handling) | < 150 KB gzipped |
| Panels (lazy-loaded) | < 80 KB each gzipped |
| AI WASM models | Loaded on demand; cached in IndexedDB |
| Total first load | < 500 KB gzipped |

### 10.2 Runtime Optimisations

| Technique | Implementation |
|-----------|---------------|
| Offscreen canvas | Static elements cached; redraw only on change |
| Image pyramids | Store 512px, 1024px, 2048px variants; use smallest that fills viewport |
| Object URL pooling | Revoke URLs immediately on delete; pool for duplicates |
| RequestAnimationFrame throttling | Limit Konva renders to 60fps; skip frames during rapid gestures |
| Web Worker for exports | Heavy exports (GIF, WebM) run in worker to avoid blocking UI |
| WASM model caching | Models stored in IndexedDB; progressive download with progress |
| Memory pressure | Monitor `performance.memory`; unload distant/off-screen photo blobs |

### 10.3 Benchmarks

| Scenario | Target |
|----------|--------|
| First paint (mobile 3G) | < 2.0s |
| Interactive (desktop) | < 1.5s |
| Add 10 photos to canvas | < 500ms |
| Export 1080×1350 PNG | < 1.0s |
| Export 1080×1920 GIF (5s, 30fps) | < 10s |
| 50-layer project | 60fps pan/zoom |
| 100-layer project | 30fps pan/zoom (acceptable) |

---

## 11. Accessibility Plan

### 11.1 WCAG 2.2 AA Compliance

| Guideline | Implementation |
|-----------|---------------|
| 1.3.1 Info & Relationships | Semantic HTML; ARIA roles for custom components |
| 1.4.3 Contrast (Minimum) | All text ≥ 4.5:1; large text ≥ 3:1; UI elements ≥ 3:1 |
| 2.1.1 Keyboard | All functions operable via keyboard; visible focus indicators |
| 2.4.3 Focus Order | Logical tab order; skip links for panel navigation |
| 2.5.5 Target Size | All touch targets ≥ 44×44px |
| 4.1.2 Name/Role/Value | ARIA labels on all icon buttons; live regions for toasts |

### 11.2 Specific Features

1. **Keyboard-driven canvas** — Tab cycles through elements; arrow keys nudge; `Enter` enters text edit; `Delete` removes; `Esc` deselects
2. **Screen-reader mode** — Optional audio descriptions of canvas state ("3 photos, 1 text, selected: photo of sunset")
3. **High-contrast mode** — Separate theme for users who need maximum contrast
4. **Reduced-motion** — Respect `prefers-reduced-motion` for all animations (already partially done)
5. **Focus-visible** — Use `:focus-visible` (not `:focus`) for clean keyboard outlines
6. **ARIA live regions** — Export progress, save confirmations, error messages announced
7. **Alt text for photos** — Prompt users to add alt text on upload; use in screen-reader mode

---

## 12. Timeline & Effort Estimates

| Phase | Duration | Team Size | Key Deliverable |
|-------|----------|-----------|-----------------|
| Phase 1: Foundation | 4 weeks | 1 dev | New shell, accessibility, mobile lang fix, smaller bundle |
| Phase 2: Creative Power-Up | 6 weeks | 1 dev | Typography, shapes, guides, filters, templates |
| Phase 3: Intelligence | 6 weeks | 1 dev | AI features, WASM integration, WebGPU |
| Phase 4: Animation & Export | 6 weeks | 1 dev | GIF/WebM, timeline, SVG/PDF, print-ready |
| Phase 5: Polish & Scale | 6 weeks | 1 dev | Performance, version history, cross-tab, context menus |
| **Buffer / Bugfix** | **4 weeks** | 1 dev | Fix issues, optimise, polish edge cases |
| **TOTAL** | **~32 weeks** | **1 dev** | **~8 months full-time** |

**Parallelisable:** Phases 2–4 have some overlap potential (e.g., export formats can be built alongside animation). With aggressive parallel work, a single developer could compress this to **6 months**.

**MVP Shortcut:** If shipping a "v2.0" sooner, prioritise Phase 1 + Phase 2 (14 weeks) for a dramatically improved creative tool, then add AI and animation in v2.1 and v2.2.

---

## Appendix A: Language Switcher Bug Fix

**Bug:** `LangSwitcher` is only rendered inside the desktop header (`hidden sm:flex`) and is absent from the mobile action sheet.

**Fix:** In `HeaderBar.tsx`, add an `ActionItem` inside the mobile `<ActionSheet>` block:

```tsx
<ActionItem
  onClick={() => { setSheetOpen(false); /* toggle lang */ }}
  icon={<span className="text-lg">{lang === 'de' ? '🇬🇧' : '🇩🇪'}</span>}
  label={lang === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'}
/>
```

Add `LangSwitcher` import and a `LangSwitcherMobile` component that toggles between the two languages with a single tap, placed in the ActionSheet before the first divider.

---

## Appendix B: Quick-Win Priorities (Do These First)

If you want immediate impact with minimal effort:

1. **Fix mobile language switcher** — ½ day, huge UX win for DE users
2. **Add keyboard shortcuts** — 2 days, power-user delight
3. **Add export presets** — 2 days, reduces friction for every user
4. **Add alignment guides** — 3 days, makes layouts look professional instantly
5. **Replace alerts with toasts** — 1 day, polish
6. **Code-split panels** — 2 days, faster load
7. **Add custom fonts** — 3 days, creative unlock

These 7 items = ~2 weeks of work and transform the feel of the app.

---

*Last updated: 2026-07-20*
*Next review: After Phase 1 completion*
