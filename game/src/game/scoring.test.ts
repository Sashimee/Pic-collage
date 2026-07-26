import { describe, expect, it } from 'vitest'
import { KEEPER, PITCH, ROUND } from './constants'
import { keeperSaves, makeKeeper, startDive, stepKeeper } from './keeper'
import { TARGETS, evaluateCrossing, findTarget, outcomeMessageKey, starsFor } from './scoring'

describe('evaluateCrossing', () => {
  const farKeeper = -PITCH.goalHalfWidth

  it('scores a ball inside the frame away from the keeper', () => {
    expect(evaluateCrossing(3, 1.5, farKeeper).outcome).toBe('goal')
  })

  it('is a save when the keeper is in the way', () => {
    expect(evaluateCrossing(0.5, 1, 0).outcome).toBe('save')
  })

  it('sails over a low keeper', () => {
    expect(evaluateCrossing(0, KEEPER.reachHeight + 0.3, 0).outcome).toBe('goal')
  })

  it('is over when above the crossbar', () => {
    expect(evaluateCrossing(0, PITCH.goalHeight + 1, farKeeper).outcome).toBe('over')
  })

  it('is wide outside the posts', () => {
    expect(evaluateCrossing(PITCH.goalHalfWidth + 1, 1, farKeeper).outcome).toBe('wide')
  })

  it('clonks the post at the very edge', () => {
    expect(evaluateCrossing(PITCH.goalHalfWidth, 1, farKeeper).outcome).toBe('post')
  })

  it('clonks the crossbar just under the top', () => {
    expect(evaluateCrossing(0, PITCH.goalHeight, farKeeper).outcome).toBe('post')
  })

  it('reports the bonus crown that was hit', () => {
    for (const crown of TARGETS) {
      // Park the keeper on the opposite side so the crown is actually reachable.
      const keeperX = -Math.sign(crown.x || 1) * PITCH.goalHalfWidth
      expect(evaluateCrossing(crown.x, crown.y, keeperX).target).toBe(crown.id)
    }
  })

  it('hangs every crown where a real shot can actually reach it', () => {
    // Regression: the crowns were first placed near the crossbar, which no
    // trajectory ever reaches — they were pure decoration.
    for (const crown of TARGETS) {
      expect(crown.y - crown.radius).toBeLessThan(2.0)
      expect(Math.abs(crown.x) + crown.radius).toBeLessThan(PITCH.goalHalfWidth)
    }
  })

  it('leaves at least three quarters of the goal open at all times', () => {
    // Sanity check on tuning: the keeper must never be able to cover the goal.
    const covered = (2 * KEEPER.reach) / (2 * PITCH.goalHalfWidth)
    expect(covered).toBeLessThan(0.3)
  })
})

describe('findTarget', () => {
  it('returns null away from every crown', () => {
    expect(findTarget(0, 0.2)).toBeNull()
  })
})

describe('starsFor', () => {
  it('never returns zero — a child who misses everything still gets a star', () => {
    expect(starsFor(0, 0)).toBe(1)
  })

  it('gives two stars for a decent round', () => {
    expect(starsFor(3, 0)).toBe(2)
  })

  it('gives three stars for a perfect round', () => {
    expect(starsFor(ROUND.shotsPerRound, 0)).toBe(ROUND.starsForPerfect)
  })

  it('lets bonus crowns make up for one miss', () => {
    expect(starsFor(4, 2)).toBe(ROUND.starsForPerfect)
  })

  it('is bounded by the maximum', () => {
    expect(starsFor(99, 99)).toBe(ROUND.starsForPerfect)
  })
})

describe('keeper', () => {
  it('patrols within its range', () => {
    let k = makeKeeper()
    for (let i = 0; i < 600; i++) {
      k = stepKeeper(k, 1 / 60)
      expect(Math.abs(k.x)).toBeLessThanOrEqual(KEEPER.patrolRange + 1e-6)
    }
  })

  it('patrols slowly enough to be readable', () => {
    let k = makeKeeper()
    const start = k.x
    k = stepKeeper(k, 1 / 60)
    expect(Math.abs(k.x - start)).toBeLessThan(0.1)
  })

  it('holds position while diving, then resumes the patrol', () => {
    let k = startDive(makeKeeper(), 3)
    expect(k.diveDir).toBe(1)
    const held = stepKeeper(k, 0.1)
    expect(held.diveDir).toBe(1)
    for (let i = 0; i < 60; i++) k = stepKeeper(k, 1 / 60)
    expect(k.diveDir).toBe(0)
  })

  it('cannot reach a ball in the far corner', () => {
    expect(keeperSaves(PITCH.goalHalfWidth - 0.5, 1, 0)).toBe(false)
  })
})

describe('outcomeMessageKey', () => {
  it('maps every outcome to a shout', () => {
    for (const o of ['goal', 'save', 'post', 'over', 'wide'] as const) {
      expect(outcomeMessageKey(o)).toMatch(/^shout\./)
    }
  })
})
