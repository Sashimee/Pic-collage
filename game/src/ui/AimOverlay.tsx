import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { shotFromDrag } from '../game/aim'
import type { Shot } from '../game/aim'
import { SHOT } from '../game/constants'

interface Point {
  x: number
  y: number
}

/**
 * The entire control scheme: put a finger down anywhere, flick towards the
 * goal, let go.
 *
 * It lives in its own component with its own state so that dragging — which
 * updates at pointer rate — never re-renders the 3D scene next to it.
 */
export function AimOverlay({
  canShoot,
  onShoot,
  hint,
}: {
  canShoot: () => boolean
  onShoot: (shot: Shot) => void
  hint: string
}) {
  const start = useRef<Point | null>(null)
  const [current, setCurrent] = useState<Point | null>(null)

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canShoot()) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY }
    setCurrent({ x: e.clientX, y: e.clientY })
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    if (!start.current) return
    setCurrent({ x: e.clientX, y: e.clientY })
  }

  function up(e: ReactPointerEvent<HTMLDivElement>) {
    const from = start.current
    start.current = null
    setCurrent(null)
    if (!from || !canShoot()) return

    const shot = shotFromDrag({
      startX: from.x,
      startY: from.y,
      endX: e.clientX,
      endY: e.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    })
    if (shot) onShoot(shot)
  }

  const dragging = start.current !== null && current !== null
  const power = dragging ? powerOf(start.current!, current!) : 0

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {dragging && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="aim" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffe066" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <line
            x1={start.current!.x}
            y1={start.current!.y}
            x2={current!.x}
            y2={current!.y}
            stroke="url(#aim)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray="2 22"
          />
          <circle
            cx={start.current!.x}
            cy={start.current!.y}
            r={26 + power * 26}
            fill="none"
            stroke="#ffe066"
            strokeOpacity={0.5 + power * 0.5}
            strokeWidth={6}
          />
          <circle cx={current!.x} cy={current!.y} r={14} fill="#fff3b0" />
        </svg>
      )}

      {!dragging && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <p className="animate-wobble rounded-full bg-black/35 px-4 py-2 text-base font-bold text-white backdrop-blur-sm">
            👆 {hint}
          </p>
        </div>
      )}
    </div>
  )
}

function powerOf(from: Point, to: Point): number {
  const dy = (from.y - to.y) / window.innerHeight
  return Math.max(0, Math.min(1, dy / SHOT.fullPowerFraction))
}
