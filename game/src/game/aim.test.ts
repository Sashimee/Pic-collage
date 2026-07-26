import { describe, expect, it } from 'vitest'
import { applyAimAssist, predictCrossX, predictCrossY, shotFromDrag } from './aim'
import type { DragInput } from './aim'
import { ASSIST, PITCH, SHOT } from './constants'
import { crossPlaneZ, makeBall, stepBall } from './physics'
import { vec } from './physics'

const VIEWPORT = { viewportWidth: 400, viewportHeight: 800 }

function flick(dx: number, dy: number): DragInput {
  return { startX: 200, startY: 600, endX: 200 + dx, endY: 600 - dy, ...VIEWPORT }
}

describe('shotFromDrag', () => {
  it('rejects a tap', () => {
    expect(shotFromDrag(flick(0, 2))).toBeNull()
  })

  it('rejects a downward flick', () => {
    expect(shotFromDrag(flick(0, -200))).toBeNull()
  })

  it('shoots towards the goal (-z) on an upward flick', () => {
    const shot = shotFromDrag(flick(0, 200))!
    expect(shot.velocity.z).toBeLessThan(0)
    expect(shot.velocity.y).toBeGreaterThan(0)
  })

  it('maps swipe direction to shot direction — left goes left', () => {
    expect(shotFromDrag(flick(-120, 200))!.velocity.x).toBeLessThan(0)
    expect(shotFromDrag(flick(120, 200))!.velocity.x).toBeGreaterThan(0)
  })

  it('gives more power to a longer flick', () => {
    const soft = shotFromDrag(flick(0, 80))!
    const hard = shotFromDrag(flick(0, 400))!
    expect(hard.power).toBeGreaterThan(soft.power)
    expect(Math.abs(hard.velocity.z)).toBeGreaterThan(Math.abs(soft.velocity.z))
  })

  it('clamps power at 1 for an over-long flick', () => {
    expect(shotFromDrag(flick(0, 4000))!.power).toBe(1)
  })

  it('caps the sideways angle so a wild swipe cannot fire backwards', () => {
    const wild = shotFromDrag({ startX: 10, startY: 700, endX: 390, endY: 690, ...VIEWPORT })
    // Nearly horizontal: either rejected, or still aimed at the goal.
    if (wild) expect(wild.velocity.z).toBeLessThan(0)
  })

  it('even the weakest accepted flick reaches the goal line', () => {
    const weak = shotFromDrag(flick(0, SHOT.minDragFraction * VIEWPORT.viewportHeight + 1))!
    expect(simulate(weak.velocity, weak.spin).reached).toBe(true)
  })
})

describe('aim assist', () => {
  it('leaves a shot down the middle alone', () => {
    const straight = { velocity: vec(0, 4, -16), spin: 0, power: 0.5 }
    expect(applyAimAssist(straight).spin).toBe(0)
  })

  it('bends a near miss back between the posts', () => {
    // Aimed just outside the right post.
    const target = PITCH.goalHalfWidth + 0.8
    const vz = -16
    const t = (PITCH.ballStart.z - PITCH.goalZ) / -vz
    const near = { velocity: vec(target / t, 4, vz), spin: 0, power: 0.6 }

    const assisted = applyAimAssist(near)
    expect(assisted.spin).not.toBe(0)

    const { crossing } = simulate(assisted.velocity, assisted.spin)
    expect(Math.abs(crossing!.x)).toBeLessThan(PITCH.goalHalfWidth)
  })

  it('leaves a wildly wide shot alone — magnetism that obvious looks broken', () => {
    const vz = -16
    const t = (PITCH.ballStart.z - PITCH.goalZ) / -vz
    const wild = { velocity: vec((PITCH.goalHalfWidth + ASSIST.outerBand + 2) / t, 4, vz), spin: 0, power: 1 }
    expect(applyAimAssist(wild).spin).toBe(0)
  })

  it('does not flip a shot to the wrong side of the goal', () => {
    const vz = -16
    const t = (PITCH.ballStart.z - PITCH.goalZ) / -vz
    const near = { velocity: vec(-(PITCH.goalHalfWidth + 0.5) / t, 4, vz), spin: 0, power: 0.6 }
    const { crossing } = simulate(applyAimAssist(near).velocity, applyAimAssist(near).spin)
    expect(crossing!.x).toBeLessThan(0)
  })
})

describe('predictions', () => {
  it('predictCrossX is null for a shot that never reaches the line', () => {
    expect(predictCrossX(vec(0, 5, 3))).toBeNull()
  })

  it('predictCrossY accounts for gravity', () => {
    const v = vec(0, 5, -16)
    expect(predictCrossY(v)).toBeLessThan(PITCH.ballStart.y + 5)
  })
})

/** Runs a real simulation and reports where the ball crossed the goal line. */
function simulate(velocity: ReturnType<typeof vec>, spin: number) {
  let b = { ...makeBall(), v: { ...velocity }, spin, resting: false }
  for (let i = 0; i < 400; i++) {
    const prev = b.p
    b = stepBall(b, 1 / 60)
    const crossing = crossPlaneZ(prev, b.p, PITCH.goalZ)
    if (crossing) return { reached: true, crossing }
  }
  return { reached: false, crossing: null }
}
