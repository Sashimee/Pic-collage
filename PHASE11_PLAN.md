# Phase 11: Header Redesign — Fix Menu Bug + Modern UX

## Problem Analysis
The mobile "More" menu (`MoreHorizontal` button) and export dropdown use a `fixed inset-0` overlay pattern that:
1. Competes with the parent `overflow-x-auto` container
2. Has z-index stacking issues on mobile browsers
3. Lacks proper touch targets and visual feedback
4. Menus can render off-screen or be clipped

## Solution: Complete HeaderBar Redesign

### 1. Mobile-First Architecture
- Replace the fragile inline dropdown with a **slide-up bottom sheet** for secondary actions (undo, redo, theme, lang, projects, save, new)
- Keep only the most important actions visible: **Export** + **More** (hamburger)
- The More button opens a full **ActionSheet** (like iOS) — impossible to miss, easy to dismiss

### 2. Desktop Layout
- Left: Brand logo + app name
- Center: Undo/Redo (icon + text), Theme toggle, Language switcher
- Right: Projects, Save, New/Clear, Export (primary button), Refresh
- All buttons min 40px touch target, clear hover states

### 3. ActionSheet Component (Mobile)
Create `src/components/ActionSheet.tsx`:
- Backdrop overlay with tap-to-dismiss
- Sheet slides up from bottom with spring animation (framer-motion)
- Darkened backdrop, rounded top corners
- Action rows: icon + label, full-width, 48px min height
- Sections: Edit (undo/redo), View (theme/lang), File (projects/save/new)
- Cancel button at bottom

### 4. Export Menu Redesign
- On desktop: dropdown menu below the export button
- On mobile: inline in the ActionSheet or a separate compact dropdown
- Keep share/PNG/JPG/Save as file/Open file options

### 5. Visual Improvements
- Brand: gradient sparkles icon + "Pic Collage" text (responsive)
- Primary actions: accent gradient background, white text
- Secondary actions: subtle surface background, muted text
- Active/disabled states: clear opacity changes
- Safe area padding for notched phones

### 6. Accessibility
- All buttons have `aria-label`
- Dropdowns use `role="menu"` with `role="menuitem"`
- Escape key closes menus
- Focus trap inside open menus
- `aria-expanded` on toggle buttons

### 7. i18n
- All new strings need EN+DE translations
- Keys: `menu.edit`, `menu.view`, `menu.file`, `menu.cancel`, `menu.more`, `menu.open`

## Execution
1. Write `ActionSheet.tsx` with framer-motion
2. Rewrite `HeaderBar.tsx` with new layout
3. Update `translations.ts` with new keys
4. Build, lint, test
5. Commit, push, verify production
