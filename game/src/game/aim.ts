import { ASSIST, PHYSICS, PITCH, SHOT } from './constants'
import type { Vec3 } from './physics'
import { vec } from './physics'

export interface DragInput {
  /** Pointer down / current position, in CSS pixels. */
  startX: number
  startY: number
  endX: number
  endY: number
  viewportWidth: number
  viewportHeight: number
}

export interface Shot {
  velocity: Vec3
  spin: number
  /** 0..1, only used to size the aiming arrow and pick a kick animation. */
  power: number
}

/**
 * The control scheme: **flick towards the goal**. Swipe up to shoot, swipe
 * up-left to shoot left. That reads as "throw it that way" to a 6-year-old,
 * unlike the slingshot convention (pull back to fire forwards) which inverts
 * the direction and confuses them.
 *
 * Returns null only for a flick so small it was almost certainly a stray tap.
 */
export function shotFromDrag(drag: DragInput): Shot | null {
  const dx = (drag.endX - drag.startX) / drag.viewportWidth
  // Screen y grows downwards; an upwards swipe must give a positive pull.
  const dy = (drag.startY - drag.endY) / drag.viewportHeight

  if (dy < SHOT.minDragFraction) return null // downward or tiny flick: not a shot

  // Power comes from the upward distance only, aim from the sideways distance
  // only. Even the weakest accepted flick gets SHOT.minSpeed, which is tuned to
  // reach the goal — no-fail design starts here.
  const power = clamp(dy / SHOT.fullPowerFraction, 0, 1)
  const speed = lerp(SHOT.minSpeed, SHOT.maxSpeed, power)
  const lift = lerp(SHOT.minLift, SHOT.maxLift, power)

  const angle = SHOT.maxAngle * clamp(dx / SHOT.lateralFullFraction, -1, 1)

  const velocity = vec(Math.sin(angle) * speed, lift, -Math.cos(angle) * speed)
  return applyAimAssist({ velocity, spin: 0, power })
}

/**
 * Bends near-misses back between the posts. Shots already comfortably inside
 * the goal, and wild shots far outside it, are left untouched — the first need
 * no help and the second would look like the ball was yanked by a magnet.
 */
export function applyAimAssist(shot: Shot, from: Vec3 = PITCH.ballStart): Shot {
  const crossX = predictCrossX(shot.velocity, from)
  if (crossX === null) return shot

  const inner = PITCH.goalHalfWidth - ASSIST.innerGuard
  const outer = PITCH.goalHalfWidth + ASSIST.outerBand
  const dist = Math.abs(crossX)
  if (dist <= inner || dist > outer) return shot

  const targetX = Math.sign(crossX) * PITCH.goalHalfWidth * ASSIST.targetFraction
  const correction = targetX - crossX
  const flight = flightTime(shot.velocity, from)
  if (flight <= 0) return shot

  // Spread the correction over the flight as a constant sideways acceleration:
  // x(t) = ½·spin·t². Curving the ball in looks like skill, a teleport does not.
  return { ...shot, spin: (2 * correction) / (flight * flight) }
}

/**
 * Horizontal position at which this shot would cross the goal line, ignoring
 * drag and spin. Approximate on purpose — it only has to be good enough to
 * decide whether a shot deserves a nudge.
 */
export function predictCrossX(v: Vec3, from: Vec3 = PITCH.ballStart): number | null {
  const t = flightTime(v, from)
  if (t <= 0) return null
  return from.x + v.x * t
}

function flightTime(v: Vec3, from: Vec3): number {
  if (v.z >= 0) return 0 // shot backwards; it will never reach the goal
  return (from.z - PITCH.goalZ) / -v.z
}

/** Height at the goal line, used by the preview arc and by tests. */
export function predictCrossY(v: Vec3, from: Vec3 = PITCH.ballStart): number {
  const t = flightTime(v, from)
  if (t <= 0) return from.y
  return from.y + v.y * t + 0.5 * PHYSICS.gravity * t * t
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
