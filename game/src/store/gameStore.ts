import { create } from 'zustand'
import { ROUND } from '../game/constants'
import type { ShotOutcome } from '../game/scoring'
import { starsFor } from '../game/scoring'

export type Screen = 'home' | 'wardrobe' | 'play' | 'result'

export interface GameState {
  screen: Screen
  shotsTaken: number
  goals: number
  bonuses: number
  /** Result of the shot just finished, shown as a big shout. Cleared on reset. */
  lastOutcome: ShotOutcome | null
  /** Bumped on every shot so the shout re-animates even on a repeat outcome. */
  shoutId: number
  /** Stars awarded by the round that just ended. */
  earnedStars: number

  goHome: () => void
  goWardrobe: () => void
  startRound: () => void
  finishRound: () => void
  recordShot: (outcome: ShotOutcome, target: string | null) => void
  clearShout: () => void
}

const emptyRound = {
  shotsTaken: 0,
  goals: 0,
  bonuses: 0,
  lastOutcome: null,
  shoutId: 0,
  earnedStars: 0,
}

export const useGame = create<GameState>((set, get) => ({
  screen: 'home',
  ...emptyRound,

  goHome: () => set({ screen: 'home', ...emptyRound }),
  goWardrobe: () => set({ screen: 'wardrobe' }),
  startRound: () => set({ screen: 'play', ...emptyRound }),
  finishRound: () => set({ screen: 'result' }),

  recordShot: (outcome, target) => {
    const s = get()
    const shotsTaken = s.shotsTaken + 1
    const goals = s.goals + (outcome === 'goal' ? 1 : 0)
    const bonuses = s.bonuses + (target ? 1 : 0)
    const finished = shotsTaken >= ROUND.shotsPerRound

    set({
      shotsTaken,
      goals,
      bonuses,
      lastOutcome: outcome,
      shoutId: s.shoutId + 1,
      // The round result is computed here, at the moment the last shot lands,
      // so the result screen is a pure read of already-settled state.
      earnedStars: finished ? starsFor(goals, bonuses) : 0,
    })
  },

  clearShout: () => set({ lastOutcome: null }),
}))

/** True once the child has used every shot in the round. */
export function roundIsOver(s: Pick<GameState, 'shotsTaken'>): boolean {
  return s.shotsTaken >= ROUND.shotsPerRound
}
