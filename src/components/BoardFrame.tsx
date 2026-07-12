import { Rect } from 'react-konva'
import type { Frame } from '../types'

// A decorative frame drawn on top of the collage, inside the board group so it
// is captured on export. `frame.width` is a fraction of the board's shorter axis.
export function BoardFrame({
  frame,
  width,
  height,
}: {
  frame: Frame
  width: number
  height: number
}) {
  if (frame.style === 'none') return null
  const w = Math.max(1, frame.width * Math.min(width, height))

  if (frame.style === 'polaroid') {
    const bottom = w * 2.6
    // Four opaque bands hugging the edges (thicker at the bottom).
    return (
      <>
        <Rect x={0} y={0} width={width} height={w} fill={frame.color} listening={false} />
        <Rect x={0} y={0} width={w} height={height} fill={frame.color} listening={false} />
        <Rect
          x={width - w}
          y={0}
          width={w}
          height={height}
          fill={frame.color}
          listening={false}
        />
        <Rect
          x={0}
          y={height - bottom}
          width={width}
          height={bottom}
          fill={frame.color}
          listening={false}
        />
      </>
    )
  }

  // solid / rounded: a stroked border inset by half its width so it sits inside.
  return (
    <Rect
      x={w / 2}
      y={w / 2}
      width={width - w}
      height={height - w}
      stroke={frame.color}
      strokeWidth={w}
      cornerRadius={frame.style === 'rounded' ? w * 2 : 0}
      listening={false}
    />
  )
}
