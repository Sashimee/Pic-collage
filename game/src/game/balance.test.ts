import { describe, expect, it } from 'vitest'
import { shotFromDrag } from './aim'
import { PITCH, ROUND } from './constants'
import { makeKeeper, stepKeeper } from './keeper'
import { crossPlaneZ, makeBall, stepBall } from './physics'
import { evaluateCrossing } from './scoring'
import type { ShotOutcome } from './scoring'

const VIEWPORT = { viewportWidth: 390, viewportHeight: 844 }

interface Attempt {
  outcome: ShotOutcome | 'never arrived'
  target: string | null
  crossY: number
}

/** Plays one shot end to end: flick → physics → keeper → verdict. */
function play(dxPx: number, dyPx: number, keeperPhase: number): Attempt {
  const shot = shotFromDrag({
    startX: 195,
    startY: 700,
    endX: 195 + dxPx,
    endY: 700 - dyPx,
    ...VIEWPORT,
  })
  if (!shot) return { outcome: 'never arrived', target: null, crossY: 0 }

  let ball = { ...makeBall(), v: { ...shot.velocity }, spin: shot.spin, resting: false }
  let keeper = { ...makeKeeper(), phase: keeperPhase }

  for (let i = 0; i < 400; i++) {
    const prev = ball.p
    ball = stepBall(ball, 1 / 60)
    keeper = stepKeeper(keeper, 1 / 60)
    const crossing = crossPlaneZ(prev, ball.p, PITCH.goalZ)
    if (crossing) {
      const verdict = evaluateCrossing(crossing.x, crossing.y, keeper.x)
      return { outcome: verdict.outcome, target: verdict.target, crossY: crossing.y }
    }
  }
  return { outcome: 'never arrived', target: null, crossY: 0 }
}

/**
 * A difficulty harness, not a unit test. It sweeps the whole space of flicks a
 * child could plausibly produce and asserts the game stays *kind*. Tuning any
 * constant in a way that makes the game punishing will fail here, which is the
 * point: "fun for a 6-year-old" is a property worth defending in CI.
 */
describe('difficulty balance', () => {
  const attempts: Attempt[] = []
  let n = 0
  for (let dx = -140; dx <= 140; dx += 10) {
    for (let dy = 60; dy <= 500; dy += 20) {
      attempts.push(play(dx, dy, (n++ * 0.37) % (Math.PI * 2)))
    }
  }

  const rate = (o: Attempt['outcome']) =>
    attempts.filter((a) => a.outcome === o).length / attempts.length

  it('lands every single flick on target — the ball is never lost sideways', () => {
    expect(rate('wide')).toBe(0)
    expect(rate('over')).toBe(0)
  })

  it('always reaches the goal line, even at the weakest power', () => {
    expect(rate('never arrived')).toBe(0)
  })

  it('scores most of the time, but not every time', () => {
    expect(rate('goal')).toBeGreaterThan(0.6)
    expect(rate('goal')).toBeLessThan(0.95)
  })

  it('keeps the keeper relevant enough to be worth aiming around', () => {
    expect(rate('save')).toBeGreaterThan(0.05)
  })

  it('makes a perfect round a genuine treat rather than a formality', () => {
    const perfect = Math.pow(rate('goal'), ROUND.shotsPerRound)
    expect(perfect).toBeLessThan(0.6)
    expect(perfect).toBeGreaterThan(0.1)
  })

  it('puts the bonus crowns within reach without making them automatic', () => {
    const hits = attempts.filter((a) => a.target !== null).length / attempts.length
    expect(hits).toBeGreaterThan(0.1)
    expect(hits).toBeLessThan(0.7)
  })

  it('never sends the ball over the crossbar, however hard the child swipes', () => {
    const highest = Math.max(...attempts.map((a) => a.crossY))
    expect(highest).toBeLessThan(PITCH.goalHeight)
  })
})
