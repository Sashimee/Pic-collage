# PHASE: Layout System Mega-Expansion Plan

> **Goal:** Transform Pic-Collage from "add photos then pick a layout" into a true layout-first collage app with 50+ layouts, non-rectangular cells, and user-drawn custom layouts.
> **Scope:** Client-side only. No backend. PWA-first. Mobile UX priority.
> **Phases:** 5 phases, incremental delivery. Each phase is independently shippable.

---

## Executive Summary

Three pillars:

1. **Layout-First Onboarding** — open app → pick layout → assign photos → edit. This is how Canva/Unfold work.
2. **50+ Layout Library** — massively expand preset grids, add categories (Classic, Editorial, Social, Creative), and support non-rectangular cell shapes (circles, polygons, SVG paths).
3. **User-Drawn Custom Layout** — draw horizontal/vertical divider lines on the board with finger/mouse; app auto-computes cells from the partition. Save & reuse custom layouts.

---

## Phase 1: Layout-First Onboarding Flow

> **Motto:** "Choose your layout first. Add photos second."
> **Duration:** 1-2 dev sessions. ~400 lines of code.
> **User-visible:** Yes. Completely changes empty-state UX.

### 1.1 Problem

Current flow: open app → empty state with "Add Photos" buttons → user adds photos → THEN can pick a layout. This forces the user to think about photos before structure. Most collage apps (Canva, Unfold, Layout by Instagram) do the opposite: pick structure first, then fill.

### 1.2 Solution Overview

Replace `EmptyState.tsx` with a **Layout Gallery** when the canvas is empty. After layout selection, launch a **Photo Assignment Sheet** to fill slots.

### 1.3 UX Flow (Mobile & Desktop)

```
App opens (empty canvas)
  → Show LayoutGallery overlay (not modal — replaces empty state)
    → Tabs: "All" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9+"
    → Grid of layout thumbnails (3 columns mobile, 4 desktop)
    → Each thumbnail shows the layout pattern + photo count
    → "Custom" tab at end for user-drawn layouts
  → User taps a layout
    → Apply layout (set grid mode, gridId, optionally board size)
    → Show PhotoAssignmentSheet
      → Bottom sheet (mobile) / Side panel (desktop)
      → Shows N placeholder slots matching layout cells
      → Each slot is a tappable area: tap → triggers hidden file input → pick photo
      → "Fill all from gallery" button: multi-select N photos → auto-assign left→right, top→bottom
      → "Skip" button: apply layout without photos (empty placeholders)
  → After assignment: sheet closes, user sees layout with photos in cells
    → Can tap any cell to re-pick photo
    → Can add text/stickers on top
    → Can switch to free mode to move elements around
```

### 1.4 Photo Assignment Strategy

**Winner: Hybrid approach (recommended)**

| Approach | Pros | Cons |
|----------|------|------|
| A. Per-slot file input | Simple, explicit | N clicks for N photos |
| B. Sequential wizard | Guided, clear | Slow for many photos |
| C. Multi-select then auto-assign | Fast, familiar | User can't control which photo goes where |

**Hybrid:**
- Show all N slots as tappable cards
- User taps slot 0 → picks photo → photo appears in slot 0
- Repeat for remaining slots
- ALSO show a "Auto-fill from Gallery" button at top: opens multi-select file input, picks up to N photos, assigns left→right, top→bottom order
- User can then tap any slot to swap/replace

This is how Instagram Layout works — intuitive, fast, flexible.

### 1.5 Files to Create/Modify

#### New Files

```typescript
// src/components/LayoutGallery.tsx
// Replaces EmptyState's template strip with a full layout browser.
// Props: onSelectLayout(layoutId: string), onCustomLayout()

export interface LayoutGalleryProps {
  onSelectLayout: (layoutId: string, opts?: { boardSize?: { w: number; h: number } }) => void
  onCustomLayout: () => void
  onSkip: () => void // go to free mode
}

// Features:
// - Category tabs: All | Classic | Editorial | Social | Creative | Custom
// - Photo-count filter pills: 2, 3, 4, 5, 6, 7, 8, 9+
// - Grid of LayoutPreview thumbnails (3 cols mobile, 4 desktop)
// - "Custom Layout" button with pencil icon at bottom
// - Search by name (future)
// - "Recent" section for last-used layouts (persisted in localStorage)
```

```typescript
// src/components/PhotoAssignmentSheet.tsx
// Bottom sheet (mobile) / modal (desktop) for assigning photos to cells.

export interface PhotoAssignmentSheetProps {
  layout: GridLayout
  onAssign: (assignments: { cellIndex: number; file: File }[]) => void
  onSkip: () => void
  onClose: () => void
  open: boolean
}

// Features:
// - Shows N placeholder cards in a grid matching the layout shape
// - Each card: dashed border, "+" icon, tap to pick
// - When a photo is assigned: thumbnail preview in the card
// - "Auto-fill" button: one multi-file input → assigns in reading order
// - "Skip" button: close sheet, keep empty placeholders
// - "Done" button: enabled when all slots filled (optional)
// - Swipe-to-dismiss on mobile
```

```typescript
// src/components/PhotoAssignmentSlot.tsx
// Individual slot in the assignment sheet.

export interface PhotoAssignmentSlotProps {
  cellIndex: number
  photoPreview?: string // object URL thumbnail
  onSelect: () => void
  onRemove: () => void
}
```

```typescript
// src/hooks/useLayoutGallery.ts
// Persist recent layouts + favorites in localStorage.

export function useLayoutGallery() {
  const recent: string[]
  const favorites: string[]
  const addRecent: (layoutId: string) => void
  const toggleFavorite: (layoutId: string) => void
}
```

#### Modified Files

```typescript
// src/components/EmptyState.tsx
// Major refactor. Replace the current centered card with LayoutGallery.
// Keep "Add Photos" as secondary CTA (for free-mode users who want to skip layout).
// Keep camera/gallery quick buttons visible.

// New flow:
//   if (isEmpty) {
//     return <LayoutGallery onSelectLayout={...} onCustomLayout={...} onSkip={...} />
//   }
```

```typescript
// src/store/editorStore.ts
// New actions:

interface EditorState {
  // ...existing...
  
  // Track whether user has explicitly chosen a layout (for onboarding tracking)
  layoutChosen: boolean
  
  // Apply a layout and enter grid mode
  applyLayout: (layoutId: string, opts?: { boardSize?: { w: number; h: number } }) => void
  
  // Assign a photo to a specific cell index in the current grid
  assignPhotoToCell: (cellIndex: number, file: File) => Promise<void>
  
  // Batch assign photos to cells
  batchAssignPhotos: (files: FileList) => Promise<void>
}

// Implementation of applyLayout:
// 1. Find layout by ID from GRID_LAYOUTS
// 2. setMode('grid')
// 3. setGrid(layoutId)
// 4. Optionally setBoardSize
// 5. set layoutChosen = true
// 6. Push history snapshot

// Implementation of assignPhotoToCell:
// 1. Import the file via existing importFiles logic
// 2. Find the PhotoElement at the given index in grid mode
// 3. Or create a new PhotoElement positioned to cover the cell
// 4. Use existing addPhoto + position logic
```

```typescript
// src/lib/templates.ts
// Add more templates that bundle layout + board size for quick starts.
// Add categories to templates for the gallery.

export interface Template {
  id: string
  titleKey: string
  gridId: string
  category: 'classic' | 'editorial' | 'social' | 'creative'
  boardWidth?: number
  boardHeight?: number
  gridGap?: number
  gridRadius?: number
  frame?: Partial<Frame>
}
```

### 1.6 i18n Keys Needed

```typescript
// Add to src/i18n/translations.ts:

'en': {
  // ...existing...
  'gallery.title': 'Choose a Layout',
  'gallery.subtitle': 'Pick a structure, then add your photos',
  'gallery.custom': 'Custom Layout',
  'gallery.recent': 'Recent',
  'gallery.all': 'All',
  'gallery.classic': 'Classic',
  'gallery.editorial': 'Editorial',
  'gallery.social': 'Social',
  'gallery.creative': 'Creative',
  'gallery.skip': 'Skip — Free Mode',
  'assignment.title': 'Add Photos',
  'assignment.subtitle': 'Tap a slot to add a photo',
  'assignment.autoFill': 'Auto-fill from Gallery',
  'assignment.skip': 'Skip for now',
  'assignment.done': 'Done',
  'assignment.replace': 'Replace',
  'assignment.remove': 'Remove',
  'assignment.slot': 'Slot {{n}}',
}

'de': {
  'gallery.title': 'Layout wählen',
  'gallery.subtitle': 'Wähle eine Struktur, dann füge Fotos hinzu',
  'gallery.custom': 'Eigenes Layout',
  'gallery.recent': 'Zuletzt verwendet',
  // ...etc
}
```

### 1.7 Backward Compatibility

- Existing `EmptyState` content is replaced but the component interface stays the same (renders conditionally inside `App.tsx`).
- Existing `GRID_LAYOUTS` continue to work unchanged — `LayoutGallery` consumes them.
- Users who bypass the gallery ("Skip") end up in free mode, same as before.
- Persisted projects that already have a `gridId` load normally; the gallery only shows when `elements.length === 0`.

---

## Phase 2: 50+ Layout Library Expansion

> **Motto:** "Every photo count, every style."
> **Duration:** 2-3 dev sessions. ~800 lines of data + ~200 lines of code changes.
> **User-visible:** Yes. Massive increase in layout variety.

### 2.1 New Layouts by Photo Count

Current: 23 layouts. Target: 60+ layouts.

**Count 1 (NEW category):**
- `1-full` — single photo fills entire board (essentially a full-bleed photo)
- `1-centered` — photo centered with margin (polaroid feel)

**Count 2 (current: 3 → target: 6):**
- `2-v`, `2-h`, `2-big-small` (existing)
- `2-diagonal` — two photos at slight diagonal angles, overlapping
- `2-circle` — two circular photos side by side
- `2-overlap` — two photos with 20% overlap, one slightly rotated

**Count 3 (current: 4 → target: 8):**
- `3-col`, `3-strip-h`, `3-1big-left`, `3-1big-top` (existing)
- `3-tri` — three photos arranged in a triangular cluster
- `3-circle` — three photos in a circular arrangement
- `3-overlap-stack` — stacked with slight rotation and overlap
- `3-magazine` — hero top 60%, two smaller bottom with asymmetric widths

**Count 4 (current: 6 → target: 10):**
- `4-grid`, `4-col`, `4-row`, `4-1big-top`, `4-1big-left`, `4-pinwheel` (existing)
- `4-circle` — 2x2 grid but circular cells
- `4-diamond` — diamond-shaped cells in a 2x2
- `4-magazine` — hero 70% left, three stacked right 30%
- `4-story` — vertical strip of 4 for 9:16 story format

**Count 5 (current: 3 → target: 8):**
- `5-1big-left`, `5-1big-top`, `5-2over3` (existing)
- `5-circle` — one center + four around
- `5-magazine` — full-width top 50%, 2x2 bottom
- `5-strip` — vertical filmstrip
- `5-pinterest` — masonry with varying heights

**Count 6 (current: 3 → target: 8):**
- `6-grid`, `6-2x3`, `6-1big` (existing)
- `6-circle` — hexagonal arrangement around center
- `6-magazine` — 2x3 grid with one merged cell spanning 2 rows
- `6-pinterest` — 2-column masonry
- `6-story` — vertical filmstrip

**Count 7 (current: 1 → target: 5):**
- `7-1big-top` (existing)
- `7-circle` — center + 6 around
- `7-magazine` — hero 50%, 3+3 grid bottom
- `7-pinterest` — 3-column masonry
- `7-strip` — vertical filmstrip

**Count 8 (current: 1 → target: 5):**
- `8-2x4` (existing)
- `8-magazine` — 2x4 with merged hero cells
- `8-circle` — two concentric rings
- `8-pinterest` — 3-column masonry
- `8-story` — vertical filmstrip

**Count 9 (current: 1 → target: 5):**
- `9-grid` (existing)
- `9-circle` — center + 8 around
- `9-magazine` — 3x3 with merged hero
- `9-pinterest` — 3-column masonry
- `9-story` — 3x3 vertical for stories

**Count 10+ (NEW — target: 6):**
- `10-grid` — 2x5
- `10-circle` — two rings of 5
- `12-grid` — 3x4
- `12-masonry` — 3-column masonry
- `16-grid` — 4x4
- `20-grid` — 4x5

### 2.2 Non-Rectangular Cell Shapes

Extend `GridCell` to support shape-aware clipping.

#### Type Changes (src/types.ts)

```typescript
// NEW: Shape type for grid cells
export type GridCellShape = 
  | 'rect'
  | 'circle'
  | 'rounded-rect'
  | 'ellipse'
  | 'polygon'
  | 'path'

// NEW: Extended GridCell with shape support
export interface GridCell {
  x: number
  y: number
  width: number
  height: number
  // NEW fields (all optional for backward compat):
  shape?: GridCellShape           // default 'rect'
  cornerRadius?: number            // per-cell override (0 = sharp)
  polygon?: { x: number; y: number }[]  // normalized vertices for polygon shape
  path?: string                    // SVG path string for 'path' shape
  rotation?: number               // degrees, for diagonal cells
  // Visual bounds (the AABB that contains the shape, for layout calculations)
  // x/y/width/height already serve this purpose
}

// GridLayout stays the same — cells array now can have shape properties
export interface GridLayout {
  id: string
  label: string
  count: number
  cells: GridCell[]
  // NEW: category for gallery organization
  category?: 'classic' | 'editorial' | 'social' | 'creative' | 'custom'
  // NEW: tags for search/filter (future)
  tags?: string[]
}
```

**Backward compatibility:** All existing `GridCell` objects in `grids.ts` lack `shape`, so they default to `'rect'`. No migration needed.

#### Rendering in GridView.tsx

```typescript
// In src/components/GridView.tsx:

// Replace the simple clipFunc with shape-aware clipping:

function getCellClipFunc(cell: GridCell, rect: Rect2) {
  switch (cell.shape ?? 'rect') {
    case 'rect':
      return rect cornerRadius > 0 
        ? (ctx) => roundedRectPath(ctx, rect, cornerRadius)
        : undefined // use clipX/Y/Width/Height for rect
    
    case 'circle':
      return (ctx) => {
        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h / 2
        const r = Math.min(rect.w, rect.h) / 2
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.closePath()
      }
    
    case 'ellipse':
      return (ctx) => {
        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h / 2
        const rx = rect.w / 2
        const ry = rect.h / 2
        ctx.beginPath()
        if (ctx.ellipse) {
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        } else {
          // Bezier fallback (same as shapes.ts)
        }
        ctx.closePath()
      }
    
    case 'polygon':
      return (ctx) => {
        if (!cell.polygon || cell.polygon.length < 3) return
        ctx.beginPath()
        cell.polygon.forEach((p, i) => {
          const px = rect.x + p.x * rect.w
          const py = rect.y + p.y * rect.h
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.closePath()
      }
    
    case 'path':
      return (ctx) => {
        if (!cell.path) return
        // Scale SVG path to fit rect
        const p = new Path2D(cell.path)
        // Need to transform: this is tricky in Konva clipFunc
        // Alternative: store path already normalized to 0..1, then scale
        ctx.save?.()
        ctx.translate?.(rect.x, rect.y)
        ctx.scale?.(rect.w, rect.h)
        ctx.beginPath?.()
        // Actually Konva.Context has a different API than CanvasRenderingContext2D
        // Best approach: precompute the scaled path string and use it
      }
  }
}

// For 'path' shape: store the path already scaled to the cell's rect,
// not normalized. Or store as SVG viewBox="0 0 1 1" and transform.
```

**Important:** Konva's `clipFunc` receives a `Konva.Context` which wraps `CanvasRenderingContext2D`. The API is compatible with standard 2D context methods (`beginPath`, `moveTo`, `lineTo`, `arc`, `closePath`, etc.). For `path` shapes, pre-scale the SVG path data to the actual pixel rect before storing.

#### LayoutPreview.tsx Updates

```typescript
// For non-rectangular shapes, LayoutPreview needs to draw the actual shape:

// In LayoutPreview:
{layout.cells.map((c, i) => {
  const cellX = pad + c.x * w + gap / 2
  const cellY = pad + c.y * h + gap / 2
  const cellW = c.width * w - gap
  const cellH = c.height * h - gap
  
  if (c.shape === 'circle') {
    const cx = cellX + cellW / 2
    const cy = cellY + cellH / 2
    const r = Math.min(cellW, cellH) / 2
    return <circle key={i} cx={cx} cy={cy} r={r} className={...} />
  }
  
  if (c.shape === 'polygon' && c.polygon) {
    const points = c.polygon.map(p => 
      `${cellX + p.x * cellW},${cellY + p.y * cellH}`
    ).join(' ')
    return <polygon key={i} points={points} className={...} />
  }
  
  // Default rect (existing)
  return <rect key={i} x={...} y={...} width={...} height={...} rx={...} className={...} />
})}
```

### 2.3 Layout Categories in Gallery

Add a `category` field to each `GridLayout`. Organize the gallery with:

- **All** — every layout
- **Classic** — simple grids (2-v, 4-grid, 9-grid, etc.)
- **Editorial** — magazine-style (big-small splits, asymmetric)
- **Social** — story-optimized tall layouts
- **Creative** — circles, polygons, diamonds, overlapping
- **Custom** — user-drawn layouts (Phase 3)

Update `GRID_LAYOUTS` to include categories:

```typescript
{
  id: '2-v',
  label: '2',
  count: 2,
  category: 'classic',
  cells: [ ... ],
},
{
  id: 'moodboard',
  label: '5',
  count: 5,
  category: 'editorial',
  cells: [ ... ],
},
{
  id: 'celebration',
  label: '5',
  count: 5,
  category: 'creative', // circular arrangement
  cells: [ ... ],
}
```

### 2.4 Files Modified

- `src/types.ts` — extend `GridCell`, add `GridCellShape`, add `category` to `GridLayout`
- `src/lib/grids.ts` — add 40+ new layouts with categories and shapes
- `src/components/GridView.tsx` — handle shape-aware clipping
- `src/components/LayoutPreview.tsx` — render shapes in thumbnails
- `src/components/LayoutGallery.tsx` — add category filtering tabs

---

## Phase 3: User-Drawn Custom Layout ("Draw Lines → Get Cells")

> **Motto:** "Your board, your rules. Draw the lines, we cut the zones."
> **Duration:** 3-4 dev sessions. ~600 lines of code.
> **User-visible:** Yes. Killer feature. Differentiator.

### 3.1 Overview

User enters "Custom Layout Mode" from the layout gallery. The board becomes a drawing surface. User draws horizontal or vertical lines (snapped to 5% grid) which act as dividers. When satisfied, user taps "Apply" and the app:

1. Collects all divider lines
2. Computes resulting rectangular cells via planar subdivision
3. Creates a `GridLayout` with those cells
4. Switches to grid mode with the new layout
5. Shows Photo Assignment Sheet

### 3.2 UX Flow

```
LayoutGallery → tap "Custom Layout"
  → Board clears (or preserves existing photos in free mode)
  → Shows "Custom Layout" toolbar at top:
    - "Horizontal Line" button (selected by default)
    - "Vertical Line" button
    - "Undo Line" button
    - "Clear All" button
    - "Snap: 5%" toggle (on/off)
    - "Apply Layout" button (primary)
    - "Cancel" button
  → User drags finger/mouse across board → line preview follows
    - On release: line is committed if it spans >20% of board
    - Lines snap to nearest 5% grid when snap is on
  → Lines are drawn as semi-transparent colored strokes on the board
    - Horizontal lines: blue-ish
    - Vertical lines: pink-ish
  → "Apply Layout" tap:
    → Compute cells from lines
    → Show preview of resulting cells (numbered)
    → Confirm → create layout → enter grid mode → show Photo Assignment Sheet
```

### 3.3 Algorithm: Lines → Cells

This is the core algorithm. For axis-aligned lines only, it simplifies to a "grid with custom boundaries" problem.

#### Data Model

```typescript
// src/lib/customLayout.ts

export interface DividerLine {
  id: string
  type: 'horizontal' | 'vertical'
  // Normalized position (0..1):
  // horizontal: Y coordinate (fraction of board height)
  // vertical: X coordinate (fraction of board width)
  position: number
  // Optional: partial line (not spanning full board)
  start?: number  // 0..1 along the perpendicular axis
  end?: number    // 0..1 along the perpendicular axis
}

export interface CustomLayoutDraft {
  lines: DividerLine[]
  boardWidth: number
  boardHeight: number
}
```

#### Cell Computation Algorithm

```typescript
/**
 * Compute rectangular cells from a set of axis-aligned divider lines.
 * 
 * Approach: treat lines as walls in a grid subdivision.
 * 1. Collect all unique X and Y coordinates from lines + board edges.
 * 2. Sort them.
 * 3. Each adjacent pair of Xs and Ys forms a potential sub-rectangle.
 * 4. Determine which sub-rectangles are "separated" by lines.
 * 5. Use flood-fill to find connected regions of sub-rectangles.
 * 6. Each connected region = one cell.
 * 7. Merge connected sub-rectangles into final cells.
 */
export function computeCellsFromLines(
  lines: DividerLine[],
  boardW: number = 1,
  boardH: number = 1,
): GridCell[] {
  // Step 1: Collect unique coordinates
  const xs = new Set<number>([0, 1])
  const ys = new Set<number>([0, 1])
  
  for (const line of lines) {
    if (line.type === 'vertical') {
      xs.add(line.position)
      // Partial lines still affect the grid — their endpoints don't create
      // new subdivision boundaries, they just act as walls within cells
    } else {
      ys.add(line.position)
    }
  }
  
  const xArr = Array.from(xs).sort((a, b) => a - b)
  const yArr = Array.from(ys).sort((a, b) => a - b)
  
  // Step 2: Build grid of sub-cells
  // subCells[i][j] = { x: xArr[i], y: yArr[j], w: xArr[i+1]-xArr[i], h: yArr[j+1]-yArr[j] }
  type SubCell = { xi: number; yi: number; x: number; y: number; w: number; h: number }
  const subCells: SubCell[][] = []
  for (let i = 0; i < xArr.length - 1; i++) {
    subCells[i] = []
    for (let j = 0; j < yArr.length - 1; j++) {
      subCells[i][j] = {
        xi: i, yi: j,
        x: xArr[i], y: yArr[j],
        w: xArr[i + 1] - xArr[i],
        h: yArr[j + 1] - yArr[j],
      }
    }
  }
  
  // Step 3: Build adjacency graph with walls
  // Two sub-cells are connected if no line separates them
  const isConnected = (a: SubCell, b: SubCell): boolean => {
    // Must be adjacent
    const dx = Math.abs(a.xi - b.xi)
    const dy = Math.abs(a.yi - b.yi)
    if (dx + dy !== 1) return false // not adjacent
    
    // Check if a line blocks this edge
    if (dx === 1) {
      // Vertical neighbors — check for horizontal line at the shared edge
      const sharedY = a.y
      const sharedYTop = a.y + a.h
      const sharedX = Math.max(a.x, b.x)
      // Actually for vertical neighbors, the shared edge is vertical
      // We need to check if there's a vertical line between them
      const sharedXEdge = Math.max(a.x, b.x) // the x coordinate of the edge
      // Check vertical lines at this x
      const blockingLines = lines.filter(l => 
        l.type === 'vertical' && 
        Math.abs(l.position - sharedXEdge) < 0.001 &&
        (!l.start || l.start <= sharedY) &&
        (!l.end || l.end >= sharedYTop)
      )
      return blockingLines.length === 0
    }
    
    if (dy === 1) {
      // Horizontal neighbors — check for horizontal line at shared edge
      const sharedYEdge = Math.max(a.y, b.y)
      const sharedXLeft = a.x
      const sharedXRight = a.x + a.w
      const blockingLines = lines.filter(l =>
        l.type === 'horizontal' &&
        Math.abs(l.position - sharedYEdge) < 0.001 &&
        (!l.start || l.start <= sharedXLeft) &&
        (!l.end || l.end >= sharedXRight)
      )
      return blockingLines.length === 0
    }
    
    return false
  }
  
  // Step 4: Flood-fill to find connected regions
  const visited = new Set<string>()
  const regions: SubCell[][] = []
  
  for (let i = 0; i < xArr.length - 1; i++) {
    for (let j = 0; j < yArr.length - 1; j++) {
      const key = `${i},${j}`
      if (visited.has(key)) continue
      
      const region: SubCell[] = []
      const stack: SubCell[] = [subCells[i][j]]
      visited.add(key)
      
      while (stack.length > 0) {
        const current = stack.pop()!
        region.push(current)
        
        // Check all 4 neighbors
        const neighbors = [
          { xi: current.xi + 1, yi: current.yi },
          { xi: current.xi - 1, yi: current.yi },
          { xi: current.xi, yi: current.yi + 1 },
          { xi: current.xi, yi: current.yi - 1 },
        ]
        
        for (const n of neighbors) {
          if (n.xi < 0 || n.xi >= xArr.length - 1 || n.yi < 0 || n.yi >= yArr.length - 1) continue
          const nKey = `${n.xi},${n.yi}`
          if (visited.has(nKey)) continue
          const neighbor = subCells[n.xi][n.yi]
          if (isConnected(current, neighbor)) {
            visited.add(nKey)
            stack.push(neighbor)
          }
        }
      }
      
      regions.push(region)
    }
  }
  
  // Step 5: Merge sub-cells in each region into final cells
  return regions.map((region, idx) => {
    // Find the bounding box of all sub-cells in the region
    const minX = Math.min(...region.map(r => r.x))
    const minY = Math.min(...region.map(r => r.y))
    const maxX = Math.max(...region.map(r => r.x + r.w))
    const maxY = Math.max(...region.map(r => r.y + r.h))
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      // No special shape — these are all rectangular cells
    }
  })
}
```

**Wait — there's a bug in the adjacency check above.** The `isConnected` function has incorrect logic for checking which edge is shared. Here's the corrected version:

```typescript
// CORRECTED isConnected:

const isConnected = (a: SubCell, b: SubCell): boolean => {
  const dx = b.xi - a.xi
  const dy = b.yi - a.yi
  
  // Must be exactly adjacent (not diagonal)
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false
  
  if (dx === 1) {
    // b is to the right of a
    // Shared vertical edge is at x = a.x + a.w (= b.x)
    const edgeX = a.x + a.w
    const edgeY1 = a.y
    const edgeY2 = a.y + a.h
    // A vertical line at edgeX would block if it spans [edgeY1, edgeY2]
    const blocking = lines.some(l =>
      l.type === 'vertical' &&
      Math.abs(l.position - edgeX) < 0.0001 &&
      spansOverlap(l.start ?? 0, l.end ?? 1, edgeY1, edgeY2)
    )
    return !blocking
  }
  
  if (dx === -1) {
    // b is to the left of a — same edge, just reversed
    const edgeX = a.x
    const edgeY1 = a.y
    const edgeY2 = a.y + a.h
    const blocking = lines.some(l =>
      l.type === 'vertical' &&
      Math.abs(l.position - edgeX) < 0.0001 &&
      spansOverlap(l.start ?? 0, l.end ?? 1, edgeY1, edgeY2)
    )
    return !blocking
  }
  
  if (dy === 1) {
    // b is below a
    // Shared horizontal edge is at y = a.y + a.h (= b.y)
    const edgeY = a.y + a.h
    const edgeX1 = a.x
    const edgeX2 = a.x + a.w
    const blocking = lines.some(l =>
      l.type === 'horizontal' &&
      Math.abs(l.position - edgeY) < 0.0001 &&
      spansOverlap(l.start ?? 0, l.end ?? 1, edgeX1, edgeX2)
    )
    return !blocking
  }
  
  if (dy === -1) {
    // b is above a
    const edgeY = a.y
    const edgeX1 = a.x
    const edgeX2 = a.x + a.w
    const blocking = lines.some(l =>
      l.type === 'horizontal' &&
      Math.abs(l.position - edgeY) < 0.0001 &&
      spansOverlap(l.start ?? 0, l.end ?? 1, edgeX1, edgeX2)
    )
    return !blocking
  }
  
  return false
}

function spansOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return Math.max(a1, b1) < Math.min(a2, b2)
}
```

### 3.4 Konva Drawing Interaction

```typescript
// src/components/CustomLayoutEditor.tsx
// Renders on top of the board when in custom layout mode.

import { useState, useCallback } from 'react'
import { Layer, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'

export interface CustomLayoutEditorProps {
  boardWidth: number
  boardHeight: number
  lines: DividerLine[]
  onAddLine: (line: DividerLine) => void
  onRemoveLine: (id: string) => void
  previewCells?: GridCell[] // computed preview
}

export function CustomLayoutEditor({
  boardWidth,
  boardHeight,
  lines,
  onAddLine,
  onRemoveLine,
  previewCells,
}: CustomLayoutEditorProps) {
  const [drawing, setDrawing] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
    type: 'horizontal' | 'vertical'
  } | null>(null)
  
  const SNAP = 0.05 // 5%
  
  const snap = (v: number): number => {
    return Math.round(v / SNAP) * SNAP
  }
  
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pos = e.target.getStage()?.getRelativePointerPosition()
    if (!pos) return
    
    const nx = pos.x / boardWidth
    const ny = pos.y / boardHeight
    
    // Determine line type from drag direction, or default to closest axis
    setDrawing({
      startX: nx,
      startY: ny,
      currentX: nx,
      currentY: ny,
      type: 'horizontal', // default, will flip on drag
    })
  }, [boardWidth, boardHeight])
  
  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!drawing) return
    const pos = e.target.getStage()?.getRelativePointerPosition()
    if (!pos) return
    
    const nx = pos.x / boardWidth
    const ny = pos.y / boardHeight
    
    const dx = Math.abs(nx - drawing.startX)
    const dy = Math.abs(ny - drawing.startY)
    
    setDrawing({
      ...drawing,
      currentX: nx,
      currentY: ny,
      type: dx > dy ? 'vertical' : 'horizontal',
    })
  }, [drawing, boardWidth, boardHeight])
  
  const handlePointerUp = useCallback(() => {
    if (!drawing) return
    
    const dx = Math.abs(drawing.currentX - drawing.startX)
    const dy = Math.abs(drawing.currentY - drawing.startY)
    
    // Only commit if dragged far enough (at least 10% in some direction)
    if (Math.max(dx, dy) < 0.1) {
      setDrawing(null)
      return
    }
    
    if (drawing.type === 'horizontal') {
      const y = snap((drawing.startY + drawing.currentY) / 2)
      if (y > 0.05 && y < 0.95) {
        onAddLine({
          id: crypto.randomUUID(),
          type: 'horizontal',
          position: y,
        })
      }
    } else {
      const x = snap((drawing.startX + drawing.currentX) / 2)
      if (x > 0.05 && x < 0.95) {
        onAddLine({
          id: crypto.randomUUID(),
          type: 'vertical',
          position: x,
        })
      }
    }
    
    setDrawing(null)
  }, [drawing, onAddLine])
  
  return (
    <Layer listening={true}>
      {/* Snap grid dots */}
      {Array.from({ length: 21 }, (_, i) => i * 0.05).map((x) =>
        Array.from({ length: 21 }, (_, j) => j * 0.05).map((y) => (
          <Rect
            key={`${x}-${y}`}
            x={x * boardWidth - 1}
            y={y * boardHeight - 1}
            width={2}
            height={2}
            fill="rgba(99,102,241,0.2)"
            listening={false}
          />
        ))
      )}
      
      {/* Committed lines */}
      {lines.map((line) => {
        if (line.type === 'horizontal') {
          const y = line.position * boardHeight
          return (
            <Line
              key={line.id}
              points={[0, y, boardWidth, y]}
              stroke="#6366f1"
              strokeWidth={3}
              opacity={0.7}
              onTap={() => onRemoveLine(line.id)}
              onClick={() => onRemoveLine(line.id)}
            />
          )
        } else {
          const x = line.position * boardWidth
          return (
            <Line
              key={line.id}
              points={[x, 0, x, boardHeight]}
              stroke="#ec4899"
              strokeWidth={3}
              opacity={0.7}
              onTap={() => onRemoveLine(line.id)}
              onClick={() => onRemoveLine(line.id)}
            />
          )
        }
      })}
      
      {/* Drawing preview */}
      {drawing && (
        <Line
          points={
            drawing.type === 'horizontal'
              ? [0, drawing.currentY * boardHeight, boardWidth, drawing.currentY * boardHeight]
              : [drawing.currentX * boardWidth, 0, drawing.currentX * boardWidth, boardHeight]
          }
          stroke="#6366f1"
          strokeWidth={2}
          dash={[8, 4]}
          opacity={0.5}
        />
      )}
      
      {/* Preview cells (numbered) */}
      {previewCells?.map((cell, i) => (
        <>
          <Rect
            key={`preview-${i}`}
            x={cell.x * boardWidth}
            y={cell.y * boardHeight}
            width={cell.width * boardWidth}
            height={cell.height * boardHeight}
            stroke="#22c55e"
            strokeWidth={2}
            dash={[6, 4]}
            fill="rgba(34,197,94,0.05)"
            listening={false}
          />
          <Text
            key={`label-${i}`}
            x={cell.x * boardWidth}
            y={cell.y * boardHeight}
            width={cell.width * boardWidth}
            height={cell.height * boardHeight}
            text={`${i + 1}`}
            fontSize={24}
            fill="#22c55e"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </>
      ))}
      
      {/* Invisible hit rect for drawing */}
      <Rect
        width={boardWidth}
        height={boardHeight}
        fill="transparent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </Layer>
  )
}
```

### 3.5 Custom Layout Persistence

Save user-drawn layouts to localStorage so they appear in the "Custom" category:

```typescript
// src/lib/customLayoutStorage.ts

const CUSTOM_LAYOUTS_KEY = 'pic-collage-custom-layouts-v1'

export interface SavedCustomLayout {
  id: string
  name: string
  createdAt: number
  cells: GridCell[]
  lines: DividerLine[]
}

export function saveCustomLayout(layout: SavedCustomLayout): void {
  const existing = loadCustomLayouts()
  const updated = [layout, ...existing.filter(l => l.id !== layout.id)].slice(0, 50)
  localStorage.setItem(CUSTOM_LAYOUTS_KEY, JSON.stringify(updated))
}

export function loadCustomLayouts(): SavedCustomLayout[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LAYOUTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function deleteCustomLayout(id: string): void {
  const existing = loadCustomLayouts()
  localStorage.setItem(CUSTOM_LAYOUTS_KEY, JSON.stringify(existing.filter(l => l.id !== id)))
}
```

### 3.6 Files Created

- `src/lib/customLayout.ts` — `DividerLine`, `computeCellsFromLines()`
- `src/lib/customLayoutStorage.ts` — persistence helpers
- `src/components/CustomLayoutEditor.tsx` — Konva-based line drawing overlay
- `src/components/CustomLayoutToolbar.tsx` — horizontal toolbar with line type, undo, apply, cancel

### 3.7 Files Modified

- `src/store/editorStore.ts` — add `customLayoutLines`, `customLayoutMode`, actions for CRUD on lines
- `src/components/EditorCanvas.tsx` — render `CustomLayoutEditor` layer when in custom layout mode
- `src/components/LayoutGallery.tsx` — add "Custom Layout" button + "Custom" category tab showing saved layouts

---

## Phase 4: Grid Cell Shape Rendering (Non-Rectangular Photos)

> **Motto:** "Circles, hearts, stars — cells can be anything."
> **Duration:** 1-2 dev sessions. ~300 lines of code.
> **User-visible:** Yes. Creative layouts with shaped cells.

### 4.1 Supported Shapes in Grid Mode

Extend `GridCell` shapes to render clipped photos:

| Shape | How to Render |
|-------|--------------|
| `rect` | Existing `clipFunc` with rounded rect or simple clipX/Y |
| `circle` | `clipFunc` with `ctx.arc(cx, cy, r, 0, Math.PI*2)` |
| `ellipse` | `ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2)` |
| `rounded-rect` | `roundedRectPath()` with per-cell `cornerRadius` |
| `polygon` | `clipFunc` connecting `(x + p.x * w, y + p.y * h)` points |
| `path` | Pre-scaled SVG `Path2D` in `clipFunc` |

### 4.2 GridView.tsx Changes

Replace the current `clipFunc` in `CellPhoto` with shape-aware version:

```typescript
// In GridView.tsx, inside CellPhoto component:

const getClipFunc = (cell: GridCell, rect: Rect2) => {
  const shape = cell.shape ?? 'rect'
  const radius = Math.min(cell.cornerRadius ?? 0, rect.w / 2, rect.h / 2)
  
  switch (shape) {
    case 'rect':
      if (radius > 0) {
        return (ctx: Konva.Context) => roundedRectPath(ctx, rect, radius)
      }
      return undefined // use clipX/Y/Width/Height
    
    case 'circle': {
      const cx = rect.x + rect.w / 2
      const cy = rect.y + rect.h / 2
      const r = Math.min(rect.w, rect.h) / 2
      return (ctx: Konva.Context) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.closePath()
      }
    }
    
    case 'ellipse': {
      const cx = rect.x + rect.w / 2
      const cy = rect.y + rect.h / 2
      const rx = rect.w / 2
      const ry = rect.h / 2
      return (ctx: Konva.Context) => {
        ctx.beginPath()
        if ((ctx as any).ellipse) {
          (ctx as any).ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        } else {
          // Bezier fallback
        }
        ctx.closePath()
      }
    }
    
    case 'polygon':
      if (!cell.polygon || cell.polygon.length < 3) return undefined
      return (ctx: Konva.Context) => {
        ctx.beginPath()
        cell.polygon!.forEach((p, i) => {
          const px = rect.x + p.x * rect.w
          const py = rect.y + p.y * rect.h
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.closePath()
      }
    
    case 'path':
      if (!cell.path) return undefined
      return (ctx: Konva.Context) => {
        // Konva.Context has _context which is the raw CanvasRenderingContext2D
        const raw = (ctx as any)._context as CanvasRenderingContext2D
        if (raw) {
          raw.beginPath()
          const p = new Path2D(cell.path!)
          raw.addPath?.(p, new DOMMatrix().translate(rect.x, rect.y).scale(rect.w, rect.h))
          // Fallback: manual transform if addPath not available
        }
      }
  }
}

// Then in the Group:
<Group clipFunc={clipFunc} ...>
```

**Note:** Konva's `clipFunc` context is a wrapper. The `_context` property exposes the raw `CanvasRenderingContext2D`. Use with caution and feature detection.

### 4.3 Pre-defined Polygon Shapes

Add reusable polygon definitions:

```typescript
// src/lib/cellShapes.ts

export const CELL_SHAPE_PRESETS: Record<string, { x: number; y: number }[]> = {
  triangle: [
    { x: 0.5, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
  diamond: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 },
  ],
  hexagon: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.25 },
    { x: 1, y: 0.75 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.75 },
    { x: 0, y: 0.25 },
  ],
  pentagon: [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.38 },
    { x: 0.82, y: 1 },
    { x: 0.18, y: 1 },
    { x: 0, y: 0.38 },
  ],
  octagon: [
    { x: 0.3, y: 0 },
    { x: 0.7, y: 0 },
    { x: 1, y: 0.3 },
    { x: 1, y: 0.7 },
    { x: 0.7, y: 1 },
    { x: 0.3, y: 1 },
    { x: 0, y: 0.7 },
    { x: 0, y: 0.3 },
  ],
}
```

### 4.4 Example: Circular Layout

```typescript
// In grids.ts:
{
  id: '5-circle',
  label: '5',
  count: 5,
  category: 'creative',
  cells: [
    // Center circle
    { x: 0.3, y: 0.3, width: 0.4, height: 0.4, shape: 'circle' },
    // Top
    { x: 0.3, y: 0.05, width: 0.4, height: 0.25, shape: 'circle' },
    // Right
    { x: 0.7, y: 0.3, width: 0.25, height: 0.4, shape: 'circle' },
    // Bottom
    { x: 0.3, y: 0.7, width: 0.4, height: 0.25, shape: 'circle' },
    // Left
    { x: 0.05, y: 0.3, width: 0.25, height: 0.4, shape: 'circle' },
  ],
}
```

**Note:** Circular cells will have gaps between them by design. The `gap` and `radius` settings in the layout panel should still apply (reduce cell size by gap, not clip shape).

---

## Phase 5: Polish, Performance & Testing

> **Motto:** "Fast, smooth, rock-solid."
> **Duration:** 1-2 dev sessions. ~300 lines of code.
> **User-visible:** Yes. Smooth performance, no jank.

### 5.1 Performance

- **Lazy-load layout thumbnails:** Don't render all 60+ `LayoutPreview` SVGs at once. Use `react-window` or simple pagination (render 12 at a time, load more on scroll).
- **Memoize layout computation:** Custom layout cell computation is pure — memoize with `useMemo`.
- **Debounce custom layout preview:** Don't recompute cells on every line change; debounce by 150ms.
- **SVG thumbnail caching:** Generate layout thumbnails as data URLs once, cache in memory.

### 5.2 Gestures

- **Swipe between layout categories:** In the layout gallery, swipe left/right to switch category tabs.
- **Pinch to zoom layout preview:** In Photo Assignment Sheet, pinch to zoom individual cell previews.
- **Long-press to reorder assignment slots:** Allow drag-to-reorder photos between slots before confirming.

### 5.3 Accessibility

- **Keyboard navigation:** Tab through layout thumbnails, Enter to select, Arrow keys to move between slots in assignment sheet.
- **Screen reader:** Each layout thumbnail announces "Layout for N photos: [category]. 2 photos side by side."
- **Reduced motion:** Disable all layout gallery animations when `prefers-reduced-motion` is set.

### 5.4 Testing Strategy

```typescript
// src/lib/__tests__/customLayout.test.ts

describe('computeCellsFromLines', () => {
  it('returns one cell with no lines', () => {
    const cells = computeCellsFromLines([])
    expect(cells).toHaveLength(1)
    expect(cells[0]).toEqual({ x: 0, y: 0, width: 1, height: 1 })
  })
  
  it('splits into two with one horizontal line', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.5 },
    ])
    expect(cells).toHaveLength(2)
    expect(cells[0]).toEqual({ x: 0, y: 0, width: 1, height: 0.5 })
    expect(cells[1]).toEqual({ x: 0, y: 0.5, width: 1, height: 0.5 })
  })
  
  it('splits into four with cross', () => {
    const cells = computeCellsFromLines([
      { id: '1', type: 'horizontal', position: 0.5 },
      { id: '2', type: 'vertical', position: 0.5 },
    ])
    expect(cells).toHaveLength(4)
  })
  
  it('creates L-shaped cell with partial lines', () => {
    // Complex case: partial vertical line at x=0.5 from y=0 to y=0.5
    // Should create 3 cells: left-top, right-top (half-height), bottom (full-width)
    const cells = computeCellsFromLines([
      { id: '1', type: 'vertical', position: 0.5, start: 0, end: 0.5 },
    ])
    expect(cells.length).toBeGreaterThanOrEqual(2)
  })
})

// E2E tests (Playwright):
describe('Layout-First Onboarding', () => {
  it('shows layout gallery on empty canvas', async () => {
    await page.goto('/')
    await expect(page.getByText('Choose a Layout')).toBeVisible()
  })
  
  it('selects layout and shows photo assignment sheet', async () => {
    await page.getByLabel('4 photos').first().click()
    await expect(page.getByText('Add Photos')).toBeVisible()
  })
  
  it('assigns photos to cells', async () => {
    // Upload test image to slot 0
    const fileInput = page.locator('input[type="file"]').nth(0)
    await fileInput.setInputFiles('test-image.jpg')
    await expect(page.getByAltText('Slot 1')).toBeVisible()
  })
})
```

### 5.5 Files Summary

| File | Action | Lines |
|------|--------|-------|
| `src/types.ts` | Extend `GridCell`, add `GridCellShape`, `category` | +30 |
| `src/lib/grids.ts` | Add 40+ new layouts | +400 |
| `src/lib/customLayout.ts` | Divider types + `computeCellsFromLines()` | +120 |
| `src/lib/customLayoutStorage.ts` | `save/load/deleteCustomLayout()` | +40 |
| `src/lib/cellShapes.ts` | Polygon presets | +30 |
| `src/store/editorStore.ts` | `applyLayout`, `assignPhotoToCell`, custom layout state | +80 |
| `src/components/EmptyState.tsx` | Replace with `LayoutGallery` integration | ~rewrite |
| `src/components/LayoutGallery.tsx` | New: layout browser with categories | +250 |
| `src/components/PhotoAssignmentSheet.tsx` | New: photo slot assignment UI | +200 |
| `src/components/PhotoAssignmentSlot.tsx` | New: individual slot | +60 |
| `src/components/CustomLayoutEditor.tsx` | New: Konva line drawing | +180 |
| `src/components/CustomLayoutToolbar.tsx` | New: toolbar for custom mode | +80 |
| `src/components/GridView.tsx` | Shape-aware clipping | +60 |
| `src/components/LayoutPreview.tsx` | Render shapes in SVG | +40 |
| `src/hooks/useLayoutGallery.ts` | Recent/favorites persistence | +40 |
| `src/i18n/translations.ts` | New keys | +40 |
| `src/lib/__tests__/customLayout.test.ts` | Unit tests | +60 |
| `e2e/layout-first.spec.ts` | E2E tests | +80 |
| **Total** | | **~2200 lines** |

---

## Appendix: Sample New Layouts (Ready to Paste into grids.ts)

```typescript
// ---- Phase 2: New Layouts to Add ----

// Count 1
{ id: '1-full', label: '1', count: 1, category: 'classic', cells: [{ x: 0, y: 0, width: 1, height: 1 }] },
{ id: '1-centered', label: '1', count: 1, category: 'classic', cells: [{ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }] },

// Count 2 extras
{ id: '2-overlap', label: '2', count: 2, category: 'creative', cells: [
  { x: 0, y: 0, width: 0.7, height: 1 },
  { x: 0.3, y: 0.05, width: 0.7, height: 0.9 },
]},

// Count 3 extras
{ id: '3-tri', label: '3', count: 3, category: 'creative', cells: [
  { x: 0.25, y: 0, width: 0.5, height: 0.5, shape: 'circle' },
  { x: 0, y: 0.5, width: 0.5, height: 0.5, shape: 'circle' },
  { x: 0.5, y: 0.5, width: 0.5, height: 0.5, shape: 'circle' },
]},
{ id: '3-magazine', label: '3', count: 3, category: 'editorial', cells: [
  { x: 0, y: 0, width: 1, height: 0.6 },
  { x: 0, y: 0.6, width: 0.55, height: 0.4 },
  { x: 0.55, y: 0.6, width: 0.45, height: 0.4 },
]},

// Count 4 extras
{ id: '4-magazine', label: '4', count: 4, category: 'editorial', cells: [
  { x: 0, y: 0, width: 0.7, height: 1 },
  { x: 0.7, y: 0, width: 0.3, height: 0.33 },
  { x: 0.7, y: 0.33, width: 0.3, height: 0.33 },
  { x: 0.7, y: 0.66, width: 0.3, height: 0.34 },
]},
{ id: '4-story', label: '4', count: 4, category: 'social', cells: [
  { x: 0, y: 0, width: 1, height: 0.25 },
  { x: 0, y: 0.25, width: 1, height: 0.25 },
  { x: 0, y: 0.5, width: 1, height: 0.25 },
  { x: 0, y: 0.75, width: 1, height: 0.25 },
]},

// Count 5 extras
{ id: '5-circle', label: '5', count: 5, category: 'creative', cells: [
  { x: 0.3, y: 0.3, width: 0.4, height: 0.4, shape: 'circle' },
  { x: 0.3, y: 0.05, width: 0.4, height: 0.25, shape: 'circle' },
  { x: 0.7, y: 0.3, width: 0.25, height: 0.4, shape: 'circle' },
  { x: 0.3, y: 0.7, width: 0.4, height: 0.25, shape: 'circle' },
  { x: 0.05, y: 0.3, width: 0.25, height: 0.4, shape: 'circle' },
]},
{ id: '5-pinterest', label: '5', count: 5, category: 'social', cells: [
  { x: 0, y: 0, width: 0.5, height: 0.4 },
  { x: 0.5, y: 0, width: 0.5, height: 0.6 },
  { x: 0, y: 0.4, width: 0.5, height: 0.6 },
  { x: 0.5, y: 0.6, width: 0.5, height: 0.4 },
  { x: 0.25, y: 0.35, width: 0.5, height: 0.3 },
]},

// Count 6 extras
{ id: '6-pinterest', label: '6', count: 6, category: 'social', cells: [
  { x: 0, y: 0, width: 1 / 3, height: 0.35 },
  { x: 1 / 3, y: 0, width: 1 / 3, height: 0.55 },
  { x: 2 / 3, y: 0, width: 1 / 3, height: 0.4 },
  { x: 0, y: 0.35, width: 1 / 3, height: 0.65 },
  { x: 1 / 3, y: 0.55, width: 1 / 3, height: 0.45 },
  { x: 2 / 3, y: 0.4, width: 1 / 3, height: 0.6 },
]},

// Count 7+
{ id: '7-magazine', label: '7', count: 7, category: 'editorial', cells: [
  { x: 0, y: 0, width: 1, height: 0.45 },
  { x: 0, y: 0.45, width: 1 / 3, height: 0.275 },
  { x: 1 / 3, y: 0.45, width: 1 / 3, height: 0.275 },
  { x: 2 / 3, y: 0.45, width: 1 / 3, height: 0.275 },
  { x: 0, y: 0.725, width: 1 / 3, height: 0.275 },
  { x: 1 / 3, y: 0.725, width: 1 / 3, height: 0.275 },
  { x: 2 / 3, y: 0.725, width: 1 / 3, height: 0.275 },
]},
{ id: '10-grid', label: '10', count: 10, category: 'classic', cells: [
  { x: 0, y: 0, width: 0.5, height: 0.2 },
  { x: 0.5, y: 0, width: 0.5, height: 0.2 },
  { x: 0, y: 0.2, width: 0.5, height: 0.2 },
  { x: 0.5, y: 0.2, width: 0.5, height: 0.2 },
  { x: 0, y: 0.4, width: 0.5, height: 0.2 },
  { x: 0.5, y: 0.4, width: 0.5, height: 0.2 },
  { x: 0, y: 0.6, width: 0.5, height: 0.2 },
  { x: 0.5, y: 0.6, width: 0.5, height: 0.2 },
  { x: 0, y: 0.8, width: 0.5, height: 0.2 },
  { x: 0.5, y: 0.8, width: 0.5, height: 0.2 },
]},
```

---

## Next Steps / How to Execute

1. **Create a feature branch:** `git checkout -b feat/layout-mega-expansion`
2. **Phase 1 first** — it changes the empty-state UX and is independently shippable
3. **Phase 2** — add layouts in batches (counts 1-3 first, then 4-6, then 7+)
4. **Phase 3** — custom layouts are the "wow" feature; polish heavily
5. **Phase 4** — non-rectangular cells can ship with Phase 2 layouts that use them
6. **Phase 5** — performance polish and tests at the end

**Estimated total effort:** 8-12 dev sessions. Each phase is ~2-3 sessions.
**Risk level:** Low. All changes are additive. Existing free-mode and grid-mode continue to work.
