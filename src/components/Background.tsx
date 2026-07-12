import { useMemo } from 'react'
import { Rect } from 'react-konva'
import type { Background as Bg } from '../types'
import { makePatternTile } from '../lib/patterns'

// The board background: a full-bleed rect, either a solid colour, a linear
// gradient computed from an angle, or a repeating pattern. Named 'background'
// so the stage can treat a click on it as "deselect".
export function Background({
  bg,
  width,
  height,
}: {
  bg: Bg
  width: number
  height: number
}) {
  const patternTile = useMemo(
    () =>
      bg.type === 'pattern'
        ? makePatternTile(bg.patternId, bg.color, bg.patternColor)
        : null,
    [bg.type, bg.patternId, bg.color, bg.patternColor],
  )

  if (bg.type === 'solid') {
    return (
      <Rect name="background" x={0} y={0} width={width} height={height} fill={bg.color} />
    )
  }

  if (bg.type === 'pattern' && patternTile) {
    return (
      <Rect
        name="background"
        x={0}
        y={0}
        width={width}
        height={height}
        fillPatternImage={patternTile as unknown as HTMLImageElement}
        fillPatternRepeat="repeat"
      />
    )
  }

  const rad = (bg.gradientAngle * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  const cx = width / 2
  const cy = height / 2
  const len = (Math.abs(width * dx) + Math.abs(height * dy)) / 2

  return (
    <Rect
      name="background"
      x={0}
      y={0}
      width={width}
      height={height}
      fillLinearGradientStartPoint={{ x: cx - dx * len, y: cy - dy * len }}
      fillLinearGradientEndPoint={{ x: cx + dx * len, y: cy + dy * len }}
      fillLinearGradientColorStops={[0, bg.gradientFrom, 1, bg.gradientTo]}
    />
  )
}
