import type { GridLayout } from '../types'

function getShapeElement(
  cell: GridLayout['cells'][number],
  pad: number,
  gap: number,
  w: number,
  h: number,
  active: boolean,
  index: number,
) {
  const cx = pad + cell.x * w + gap / 2
  const cy = pad + cell.y * h + gap / 2
  const cw = cell.width * w - gap
  const ch = cell.height * h - gap
  const fill = active ? 'fill-accent/70' : 'fill-muted/50'

  switch (cell.shape) {
    case 'circle': {
      const r = Math.min(cw, ch) / 2
      const midX = cx + cw / 2
      const midY = cy + ch / 2
      return (
        <circle
          key={index}
          cx={midX}
          cy={midY}
          r={r}
          className={fill}
        />
      )
    }
    case 'ellipse': {
      return (
        <ellipse
          key={index}
          cx={cx + cw / 2}
          cy={cy + ch / 2}
          rx={cw / 2}
          ry={ch / 2}
          className={fill}
        />
      )
    }
    case 'polygon': {
      const pts = cell.polygon ?? [
        { x: 0.5, y: 0 },
        { x: 1, y: 0.5 },
        { x: 0.5, y: 1 },
        { x: 0, y: 0.5 },
      ]
      const points = pts
        .map((p) => `${cx + p.x * cw},${cy + p.y * ch}`)
        .join(' ')
      return <polygon key={index} points={points} className={fill} />
    }
    case 'rounded-rect': {
      return (
        <rect
          key={index}
          x={cx}
          y={cy}
          width={cw}
          height={ch}
          rx={cell.cornerRadius ?? 2}
          className={fill}
        />
      )
    }
    default:
      return (
        <rect
          key={index}
          x={cx}
          y={cy}
          width={cw}
          height={ch}
          rx={2}
          className={fill}
        />
      )
  }
}

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
        layout.cells.map((c, i) => getShapeElement(c, pad, gap, w, h, active, i))
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
