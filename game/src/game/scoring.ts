import { PITCH, ROUND } from './constants'
import { keeperSaves } from './keeper'

export type ShotOutcome = 'goal' | 'save' | 'post' | 'over' | 'wide'

/** Bonus crowns hanging in the goal mouth. Hitting one is worth a extra star. */
export interface Target {
  id: string
  x: number
  y: number
  radius: number
}

/**
 * Positions are tuned against the *actual* trajectory envelope: a real shot
 * crosses the line between y≈0.3 and y≈2.0, so crowns hung up near the crossbar
 * (where they look best) could never be hit. These sit where the ball goes.
 */
export const TARGETS: Target[] = [
  { id: 'left', x: -3.3, y: 1.5, radius: 0.7 },
  { id: 'right', x: 3.3, y: 1.5, radius: 0.7 },
  // Just at the top of the keeper's reach: the risky, show-off crown.
  { id: 'top', x: 0, y: 1.95, radius: 0.7 },
]

export interface CrossingResult {
  outcome: ShotOutcome
  /** Id of the bonus crown hit, if any. */
  target: string | null
}

/**
 * Judges the ball at the instant it crosses the goal line. Split out from the
 * render loop so the whole rule set is testable without a canvas.
 */
export function evaluateCrossing(
  crossX: number,
  crossY: number,
  keeperX: number,
): CrossingResult {
  const inner = PITCH.goalHalfWidth - PITCH.postRadius
  const outer = PITCH.goalHalfWidth + PITCH.postRadius

  if (crossY > PITCH.goalHeight + PITCH.postRadius) return { outcome: 'over', target: null }
  if (Math.abs(crossX) > outer) return { outcome: 'wide', target: null }
  // Grazing a post, or clipping the crossbar.
  if (Math.abs(crossX) > inner) return { outcome: 'post', target: null }
  if (crossY > PITCH.goalHeight - PITCH.postRadius) return { outcome: 'post', target: null }

  if (keeperSaves(crossX, crossY, keeperX)) return { outcome: 'save', target: null }

  return { outcome: 'goal', target: findTarget(crossX, crossY) }
}

export function findTarget(x: number, y: number): string | null {
  for (const t of TARGETS) {
    if (Math.hypot(x - t.x, y - t.y) <= t.radius) return t.id
  }
  return null
}

/**
 * Stars for a finished round. **Never returns 0** — the floor of one star is
 * the whole point: a child who misses every shot still gets a reward, a
 * "encore !" and a reason to press play again.
 */
export function starsFor(goals: number, bonuses: number): number {
  const scored = goals + bonuses
  if (goals >= ROUND.shotsPerRound || scored >= ROUND.shotsPerRound + 1) return ROUND.starsForPerfect
  if (goals >= 3) return 2
  return 1
}

/**
 * Short key into the i18n table for the on-screen shout after a shot. The
 * literal return type keeps this honest against the translation keys without
 * the game rules having to import the i18n module.
 */
export function outcomeMessageKey(
  outcome: ShotOutcome,
): 'shout.goal' | 'shout.save' | 'shout.post' | 'shout.miss' {
  return outcome === 'goal' ? 'shout.goal' : outcome === 'save' ? 'shout.save' : outcome === 'post' ? 'shout.post' : 'shout.miss'
}
