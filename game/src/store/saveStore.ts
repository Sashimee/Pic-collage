import { create } from 'zustand'
import { BALLS, PRINCESSES } from '../data/roster'

const KEY = 'royaume-foot:save:v1'

export interface SaveState {
  /** Lifetime stars. Never spent — see the note on unlocking below. */
  stars: number
  princessId: string
  ballId: string
  muted: boolean
  addStars: (n: number) => void
  setPrincess: (id: string) => void
  setBall: (id: string) => void
  toggleMute: () => void
}

interface Persisted {
  stars: number
  princessId: string
  ballId: string
  muted: boolean
}

function load(): Persisted {
  const fallback: Persisted = {
    stars: 0,
    princessId: PRINCESSES[0].id,
    ballId: BALLS[0].id,
    muted: false,
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      stars: typeof parsed.stars === 'number' && parsed.stars >= 0 ? parsed.stars : 0,
      // Guard against a save written by an older build that named things we no
      // longer ship, otherwise the child boots into an empty wardrobe.
      princessId: PRINCESSES.some((p) => p.id === parsed.princessId)
        ? parsed.princessId!
        : fallback.princessId,
      ballId: BALLS.some((b) => b.id === parsed.ballId) ? parsed.ballId! : fallback.ballId,
      muted: parsed.muted === true,
    }
  } catch {
    // Private mode, disabled storage, corrupt JSON — the game must still run.
    return fallback
  }
}

function persist(state: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Progress simply won't survive a reload. Not worth interrupting play.
  }
}

export const useSave = create<SaveState>((set, get) => ({
  ...load(),
  addStars: (n) => {
    set({ stars: get().stars + n })
    save(get)
  },
  setPrincess: (id) => {
    set({ princessId: id })
    save(get)
  },
  setBall: (id) => {
    set({ ballId: id })
    save(get)
  },
  toggleMute: () => {
    set({ muted: !get().muted })
    save(get)
  },
}))

function save(get: () => SaveState) {
  const { stars, princessId, ballId, muted } = get()
  persist({ stars, princessId, ballId, muted })
}

/**
 * Unlocks are **thresholds, not purchases**. A 6-year-old handling a currency
 * ("do I spend 5 stars now or save for 12?") is a chore; things simply
 * appearing as they play is a gift. Nothing is ever taken away.
 */
export function isUnlocked(unlockStars: number, stars: number): boolean {
  return stars >= unlockStars
}
