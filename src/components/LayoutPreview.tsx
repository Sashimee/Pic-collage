import type { GridLayout } from '../types'

// A visual thumbnail of a grid layout: each normalised cell drawn as a rounded
// rect on a board-proportioned frame. Used in the big-thumbnail layout picker.
export function LayoutPreview({
  layout,
  width,
  height,
  active,
}: {
  layout: GridLayout | null // null = "Free" (no grid)
  width: number
  height: number
  active: boolean
}) {
  const pad = 3
  const gap = 2
  const w = width - pad * 2
  const h = height - pad * 2

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`rounded-lg transition ${
        active
          ? 'ring-2 ring-accent'
          : 'ring-1 ring-border hover:ring-accent/50'
      }`}
    >
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        className={active ? 'fill-accent/15' : 'fill-surface-2'}
      />
      {layout ? (
        layout.cells.map((c, i) => (
          <rect
            key={i}
            x={pad + c.x * w + gap / 2}
            y={pad + c.y * h + gap / 2}
            width={c.width * w - gap}
            height={c.height * h - gap}
            rx={2}
            className={active ? 'fill-accent/70' : 'fill-muted/50'}
          />
        ))
      ) : (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className={`text-[13px] font-medium ${active ? 'fill-accent' : 'fill-muted'}`}
        >
          ⊞
        </text>
      )}
    </svg>
  )
}
