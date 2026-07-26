import { KEEPER } from './constants'

export interface KeeperState {
  x: number
  /** Patrol phase in radians. */
  phase: number
  /** -1 left, 0 none, 1 right. */
  diveDir: number
  /** Seconds elapsed in the current dive, or 0. */
  diveTime: number
}

export function makeKeeper(): KeeperState {
  return { x: KEEPER.startX, phase: 0, diveDir: 0, diveTime: 0 }
}

/**
 * The keeper (a very friendly dragon) patrols on a slow, perfectly predictable
 * sine. That is a deliberate design choice, not laziness: a readable pattern is
 * something a 6-year-old can *learn to beat*, which feels like skill. Random
 * dives would just feel unfair.
 */
export function stepKeeper(k: KeeperState, dt: number): KeeperState {
  const phase = k.phase + (KEEPER.patrolSpeed / KEEPER.patrolRange) * dt
  const diveTime = k.diveDir === 0 ? 0 : k.diveTime + dt
  const diving = k.diveDir !== 0 && diveTime < KEEPER.diveDuration

  return {
    // While diving the keeper stops patrolling and leans into the dive.
    x: diving ? k.x : Math.sin(phase) * KEEPER.patrolRange,
    phase,
    diveDir: diving ? k.diveDir : 0,
    diveTime: diving ? diveTime : 0,
  }
}

/** Starts a dive animation towards `towardX`. Purely cosmetic. */
export function startDive(k: KeeperState, towardX: number): KeeperState {
  const dir = towardX < k.x ? -1 : 1
  return { ...k, diveDir: dir, diveTime: 0 }
}

/**
 * Does the keeper stop a ball crossing the line at (x, y)? Reach is small
 * relative to the goal mouth (1.15 of 4.2 either side), so roughly three
 * quarters of the goal is always open.
 */
export function keeperSaves(crossX: number, crossY: number, keeperX: number): boolean {
  if (crossY > KEEPER.reachHeight) return false
  return Math.abs(crossX - keeperX) <= KEEPER.reach
}
