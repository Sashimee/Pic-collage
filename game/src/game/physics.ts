import { PHYSICS, PITCH } from './constants'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface BallState {
  p: Vec3
  v: Vec3
  /** Sideways acceleration, in units/s². A cheap stand-in for Magnus curve. */
  spin: number
  /** True once the ball has settled on the ground and stopped bouncing. */
  resting: boolean
}

export function vec(x: number, y: number, z: number): Vec3 {
  return { x, y, z }
}

export function makeBall(p: Vec3 = { ...PITCH.ballStart }): BallState {
  return { p: { ...p }, v: vec(0, 0, 0), spin: 0, resting: true }
}

/**
 * Advances the ball by exactly `dt` seconds. Pure: it returns a new state and
 * never touches the argument, so the same function drives both the render loop
 * and the unit tests.
 *
 * `dt` is sub-stepped internally (PHYSICS.maxStep) — a 21 u/s shot moves 0.35 u
 * per frame at 60fps, which is a whole ball radius, so a single big step could
 * skip straight through the goal plane or the ground.
 */
export function stepBall(state: BallState, dt: number): BallState {
  let s: BallState = { p: { ...state.p }, v: { ...state.v }, spin: state.spin, resting: state.resting }
  let remaining = Math.min(dt, 0.25) // a backgrounded tab must not teleport the ball

  while (remaining > 0) {
    const h = Math.min(remaining, PHYSICS.maxStep)
    remaining -= h
    s = integrate(s, h)
  }
  return s
}

function integrate(s: BallState, h: number): BallState {
  const v = { ...s.v }
  const p = { ...s.p }

  v.y += PHYSICS.gravity * h
  v.x += s.spin * h

  const damp = Math.max(0, 1 - PHYSICS.drag * h)
  v.x *= damp
  v.y *= damp
  v.z *= damp

  p.x += v.x * h
  p.y += v.y * h
  p.z += v.z * h

  let resting = s.resting
  const floor = PITCH.groundY + PITCH.ballRadius
  if (p.y <= floor) {
    p.y = floor
    if (v.y < -PHYSICS.restThreshold) {
      // A real impact: bounce, and scrub speed once per bounce.
      v.y = -v.y * PHYSICS.restitution
      v.x *= PHYSICS.bounceFriction
      v.z *= PHYSICS.bounceFriction
      resting = false
    } else {
      // Rolling. Friction here is per *second*, not per sub-step — applying the
      // per-bounce factor every sub-step would stop a rolling ball dead in a
      // few frames, and a weak shot would never trickle into the goal.
      v.y = 0
      const roll = Math.max(0, 1 - PHYSICS.rollFriction * h)
      v.x *= roll
      v.z *= roll
      resting = Math.abs(v.x) < 0.3 && Math.abs(v.z) < 0.3
    }
  } else {
    resting = false
  }

  return { p, v, spin: s.spin, resting }
}

/**
 * Where a straight segment from `from` to `to` crosses the plane z = planeZ,
 * or null if it does not cross it moving forwards this step. Used to test the
 * goal line at the exact crossing point instead of at frame boundaries.
 */
export function crossPlaneZ(from: Vec3, to: Vec3, planeZ: number): Vec3 | null {
  if (from.z <= planeZ || to.z > planeZ) return null
  const span = from.z - to.z
  if (span <= 0) return null
  const t = (from.z - planeZ) / span
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: planeZ,
  }
}
