You are conducting a UI/UX design audit of the Pic-Collage React app. The goal is to identify bad presentation, missing affordances, and visual design issues — then fix them.

## Current Known Issues (from visual inspection)

1. **Tab bar scrollability not discoverable** — The left vertical tab bar (Photos, Layout, Text, Draw, Stickers, Background, Filters, Layers, History, Animation, Settings) has NO scroll arrows or scroll indicators. Users on smaller screens cannot tell there are more tabs below. Implement left/right (or up/down for vertical) arrow buttons like in professional apps (Figma, Canva, Photoshop) that appear when content overflows.

2. **Header button clutter** — The top header has 11+ buttons crammed together (Undo, Redo, Theme, 5 language flags, Fullscreen, Projects, Save, New, Export, Refresh). This is overwhelming. Consider grouping or progressive disclosure.

3. **Language flags take too much header space** — 5 flag buttons permanently visible in the header bar. Should be collapsed into a single language dropdown or moved to Settings.

4. **Empty canvas is too blank** — The white canvas with just "Create your collage" text doesn't invite interaction. Consider a subtle grid pattern, a drop zone animation, or template previews directly on the canvas.

5. **Zoom controls are tiny and disconnected** — The zoom pill at bottom-center is small. No zoom percentage indicator near the cursor. Consider a status bar approach or floating HUD.

6. **No visible grid on empty canvas** — Users don't know the canvas size or boundaries. A subtle dot grid or crosshair would help.

7. **Tab icons lack active state distinction** — The active tab should be more prominent (color fill, highlight bar, glow).

## Your Task

1. Review ALL components in `src/components/` for UX issues:
   - `HeaderBar.tsx` — button grouping, spacing, overflow
   - `Panels.tsx` — panel layout, scroll indicators
   - `EditorCanvas.tsx` — empty state, grid visibility
   - `ZoomControls.tsx` — size, placement, discoverability
   - `LangSwitcher.tsx` — header vs. settings placement
   - `SelectionBar.tsx` — mobile touch targets
   - `EmptyState.tsx` — visual appeal, call-to-action

2. Implement scroll arrows for the tab bar:
   - Add `<ChevronUp>` / `<ChevronDown>` or `<ChevronLeft>` / `<ChevronRight>` buttons
   - Only show when content overflows (`scrollHeight > clientHeight`)
   - Smooth scroll on click
   - Fade gradient at top/bottom to indicate more content

3. Fix any other UX issues you find

4. Run `npm run lint` after every change. Keep iterating until it passes.

5. Commit with conventional commits.

## Rules
- Keep changes scoped to UX/visual — don't rewrite business logic
- Mobile-first mindset: every fix must work on 375px width
- Use Tailwind classes, don't add custom CSS unless necessary
- The tab bar scroll arrows are the HIGHEST priority

Go!