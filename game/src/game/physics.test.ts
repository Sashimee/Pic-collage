import { describe, expect, it } from 'vitest'
import { PHYSICS, PITCH, SHOT } from './constants'
import { crossPlaneZ, makeBall, stepBall, vec } from './physics'

const floor = PITCH.groundY + PITCH.ballRadius

describe('stepBall', () => {
  it('falls under gravity', () => {
    const b = { ...makeBall(vec(0, 5, 0)), resting: false }
    const after = stepBall(b, 0.1)
    expect(after.p.y).toBeLessThan(5)
    expect(after.v.y).toBeLessThan(0)
  })

  it('never sinks below the ground', () => {
    let b = { ...makeBall(vec(0, 3, 0)), resting: false }
    for (let i = 0; i < 400; i++) b = stepBall(b, 1 / 60)
    expect(b.p.y).toBeGreaterThanOrEqual(floor - 1e-6)
  })

  it('bounces then settles', () => {
    let b = { ...makeBall(vec(0, 4, 0)), resting: false }
    for (let i = 0; i < 600; i++) b = stepBall(b, 1 / 60)
    expect(b.resting).toBe(true)
    expect(b.p.y).toBeCloseTo(floor, 2)
  })

  it('does not tunnel through the ground on a huge frame step', () => {
    // A backgrounded tab can hand us a multi-second dt.
    const b = { ...makeBall(vec(0, 0.5, 0)), v: vec(0, -60, 0), spin: 0, resting: false }
    const after = stepBall(b, 3)
    expect(after.p.y).toBeGreaterThanOrEqual(floor - 1e-6)
  })

  it('sub-steps small enough that the fastest shot cannot tunnel', () => {
    // Frame-level crossings are caught exactly by crossPlaneZ, but collisions
    // resolved inside integrate() (the ground) rely on the sub-step being
    // shorter than the ball itself.
    expect(SHOT.maxSpeed * PHYSICS.maxStep).toBeLessThan(PITCH.ballRadius)
  })

  it('keeps rolling instead of stopping dead on the grass', () => {
    // Regression: applying the per-bounce friction on every sub-step froze a
    // rolling ball in a few frames, so weak shots never reached the goal.
    let b = { ...makeBall(vec(0, PITCH.ballRadius, 0)), v: vec(0, 0, -10), spin: 0, resting: false }
    for (let i = 0; i < 30; i++) b = stepBall(b, 1 / 60)
    expect(b.p.z).toBeLessThan(-3)
  })

  it('curves sideways with spin', () => {
    let b = { ...makeBall(vec(0, 1, 0)), v: vec(0, 0, -15), spin: 4, resting: false }
    for (let i = 0; i < 30; i++) b = stepBall(b, 1 / 60)
    expect(b.p.x).toBeGreaterThan(0)
  })

  it('is pure — the input state is untouched', () => {
    const b = { ...makeBall(vec(0, 5, 0)), resting: false }
    const snapshot = JSON.stringify(b)
    stepBall(b, 0.5)
    expect(JSON.stringify(b)).toBe(snapshot)
  })

  it('clamps drag to a non-negative damping factor at absurd dt', () => {
    // 1 - drag*dt must never go negative, or the ball would reverse direction.
    expect(1 - PHYSICS.drag * PHYSICS.maxStep).toBeGreaterThan(0)
  })
})

describe('crossPlaneZ', () => {
  it('interpolates the crossing point', () => {
    const hit = crossPlaneZ(vec(0, 2, 1), vec(2, 0, -1), 0)
    expect(hit).not.toBeNull()
    expect(hit!.x).toBeCloseTo(1, 5)
    expect(hit!.y).toBeCloseTo(1, 5)
    expect(hit!.z).toBe(0)
  })

  it('ignores a segment that stops short of the plane', () => {
    expect(crossPlaneZ(vec(0, 1, 5), vec(0, 1, 1), 0)).toBeNull()
  })

  it('ignores a segment travelling away from the plane', () => {
    expect(crossPlaneZ(vec(0, 1, -5), vec(0, 1, -1), 0)).toBeNull()
  })
})
