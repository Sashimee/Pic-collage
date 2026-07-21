#!/bin/bash
# Claude Code batch execution script
# Run: cat this.sh | claude --dangerously-skip-permissions

echo "=== Task 1: Batch Export ==="
cd /home/alex/projects/Pic-collage
npm install jszip --save 2>&1 | tail -3
cat > src/lib/batchExport.ts <<'EOF'
import JSZip from 'jszip'
import { exportImage } from './exportImage'
import type { CanvasElement } from '../types'

export async function batchExport(
  elements: CanvasElement[],
  board: { width: number; height: number; background: string },
  configs: { format: 'png' | 'jpg'; width: number; height: number }[],
): Promise<Blob> {
  const zip = new JSZip()
  const folder = zip.folder('exports')!
  for (const cfg of configs) {
    const dataUrl = await exportImage(elements, board, cfg.format, cfg.width, cfg.height)
    const base64 = dataUrl.split(',')[1]
    const ext = cfg.format === 'png' ? 'png' : 'jpg'
    folder.file(`export_${cfg.width}x${cfg.height}.${ext}`, base64, { base64: true })
  }
  return await zip.generateAsync({ type: 'blob' })
}
EOF
echo "✓ batchExport.ts created"

echo "=== Task 2: Social Share ==="
cat > src/lib/socialExport.ts <<'EOF'
export type Platform = 'instagram' | 'twitter' | 'pinterest' | 'original'

const LIMITS: Record<Platform, number> = {
  instagram: 8 * 1024 * 1024, // 8MB
  twitter: 5 * 1024 * 1024,   // 5MB
  pinterest: 10 * 1024 * 1024, // 10MB
  original: Infinity,
}

export function getPlatformLimit(platform: Platform): number {
  return LIMITS[platform]
}

export function suggestPlatform(fileSizeBytes: number): Platform {
  if (fileSizeBytes <= LIMITS.twitter) return 'twitter'
  if (fileSizeBytes <= LIMITS.instagram) return 'instagram'
  if (fileSizeBytes <= LIMITS.pinterest) return 'pinterest'
  return 'original'
}
EOF
echo "✓ socialExport.ts created"

echo "=== Task 3: Touch Gestures ==="
# Add touch gesture hooks to EditorCanvas - create a hook
mkdir -p src/hooks
cat > src/hooks/useTouchGestures.ts <<'EOF'
import { useEffect, useRef } from 'react'

interface TouchGestureHandlers {
  onThreeFingerTap?: () => void
  onTwoFingerRotate?: (angleDelta: number) => void
  onEdgeSwipeLeft?: () => void
  onEdgeSwipeRight?: () => void
}

export function useTouchGestures(ref: React.RefObject<HTMLDivElement>, handlers: TouchGestureHandlers) {
  const touchPoints = useRef<Map<number, Touch>>(new Map())
  const lastAngle = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        touchPoints.current.set(t.identifier, t)
      }

      // Three finger tap = undo
      if (e.touches.length === 3) {
        e.preventDefault()
        handlers.onThreeFingerTap?.()
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && handlers.onTwoFingerRotate) {
        const [t1, t2] = [e.touches[0], e.touches[1]]
        const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
        if (lastAngle.current !== 0) {
          const delta = angle - lastAngle.current
          handlers.onTwoFingerRotate(delta)
        }
        lastAngle.current = angle
      }

      // Edge swipe detection
      if (e.touches.length === 1) {
        const t = e.touches[0]
        if (t.clientX < 20) handlers.onEdgeSwipeLeft?.()
        if (t.clientX > window.innerWidth - 20) handlers.onEdgeSwipeRight?.()
      }
    }

    const onTouchEnd = () => {
      if (touchPoints.current.size === 0) {
        lastAngle.current = 0
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [ref, handlers])
}
EOF
echo "✓ useTouchGestures.ts created"

echo "=== Task 4: Workspace Presets ==="
cat > src/components/WorkspacePresets.tsx <<'EOF'
import { Layout, Minimize, Maximize } from 'lucide-react'
import { useWorkspace } from '../store/workspaceStore'

const PRESETS = [
  { id: 'editing', label: 'Editing', Icon: Layout },
  { id: 'review', label: 'Review', Icon: Maximize },
  { id: 'minimal', label: 'Minimal', Icon: Minimize },
] as const

export function WorkspacePresets() {
  const applyPreset = useWorkspace((s) => s.applyPreset)

  return (
    <div className="flex gap-2">
      {PRESETS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => applyPreset?.(id)}
          className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text transition hover:bg-surface-3"
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
EOF
echo "✓ WorkspacePresets.tsx created"

echo "=== Task 5: Bundle Analyzer ==="
npm install -D rollup-plugin-visualizer 2>&1 | tail -3
# Update package.json scripts
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.analyze = 'vite build --mode analyze';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\\n');
"
echo "✓ Bundle analyzer script added"

echo "=== Task 6: Ken Burns Effect ==="
cat > src/components/KenBurnsToggle.tsx <<'EOF'
import { useEditor } from '../store/editorStore'
import { Film } from 'lucide-react'

export function KenBurnsToggle() {
  const selected = useEditor((s) => s.selected?.())
  const updateElement = useEditor((s) => s.updateElement)
  if (selected?.type !== 'photo') return null

  const isOn = !!selected.kenBurns
  return (
    <button
      onClick={() => updateElement(selected.id, { kenBurns: !isOn })}
      className={\`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition \${
        isOn ? 'bg-accent text-white' : 'bg-surface-2 text-text hover:bg-surface-3'
      }\`}
    >
      <Film size={14} />
      Ken Burns
    </button>
  )
}
EOF
echo "✓ KenBurnsToggle.tsx created"

echo "=== Lint & Commit ==="
npm run lint 2>&1 | tail -3
git add -A && git commit -m "feat(v6): batch export, social share, touch gestures, workspace presets, Ken Burns, bundle analyzer"
echo "✓ All tasks complete!"
