/**
 * The wardrobe catalogue.
 *
 * Everything is described as plain colours and flags — the 3D characters are
 * built from primitives at render time, so adding a princess is adding an entry
 * here, not modelling and shipping a .glb.
 *
 * Names are proper nouns and stay untranslated, like the font names in the
 * collage app.
 */

export interface Princess {
  id: string
  name: string
  /** Emoji shown on the picker card, so the UI needs no reading. */
  badge: string
  skin: string
  hair: string
  hairStyle: 'buns' | 'braid' | 'long' | 'curls'
  dress: string
  dressTrim: string
  crown: string
  /** Lifetime stars needed. 0 = available from the very first launch. */
  unlockStars: number
}

export const PRINCESSES: Princess[] = [
  {
    id: 'rosalie',
    name: 'Rosalie',
    badge: '👑',
    skin: '#f6c9a8',
    hair: '#ffd45e',
    hairStyle: 'buns',
    dress: '#ff7bc0',
    dressTrim: '#ffe27a',
    crown: '#ffd84d',
    unlockStars: 0,
  },
  {
    id: 'amara',
    name: 'Amara',
    badge: '🌸',
    skin: '#8a5433',
    hair: '#2b1a12',
    hairStyle: 'curls',
    dress: '#8be0d0',
    dressTrim: '#fff3b0',
    crown: '#ffd84d',
    unlockStars: 0,
  },
  {
    id: 'yuki',
    name: 'Yuki',
    badge: '❄️',
    skin: '#f0d3bb',
    hair: '#2f3a6b',
    hairStyle: 'long',
    dress: '#9ec9ff',
    dressTrim: '#ffffff',
    crown: '#cfe8ff',
    unlockStars: 3,
  },
  {
    id: 'isabella',
    name: 'Isabella',
    badge: '🌹',
    skin: '#d9a077',
    hair: '#5b2c17',
    hairStyle: 'braid',
    dress: '#c07bff',
    dressTrim: '#ffd84d',
    crown: '#ffd84d',
    unlockStars: 6,
  },
  {
    id: 'nour',
    name: 'Nour',
    badge: '✨',
    skin: '#a8663c',
    hair: '#1b1410',
    hairStyle: 'buns',
    dress: '#ffb35c',
    dressTrim: '#fff1c9',
    crown: '#fff1c9',
    unlockStars: 10,
  },
  {
    id: 'freya',
    name: 'Freya',
    badge: '🦄',
    skin: '#fadfce',
    hair: '#ff8ad1',
    hairStyle: 'curls',
    dress: '#b6ff9c',
    dressTrim: '#ff8ad1',
    crown: '#ffd84d',
    unlockStars: 15,
  },
]

export interface BallSkin {
  id: string
  badge: string
  base: string
  accent: string
  /** Drives the procedural texture drawn onto the ball. */
  pattern: 'classic' | 'hearts' | 'rainbow' | 'stars' | 'unicorn'
  unlockStars: number
}

export const BALLS: BallSkin[] = [
  { id: 'classic', badge: '⚽', base: '#ffffff', accent: '#2b2b3d', pattern: 'classic', unlockStars: 0 },
  { id: 'hearts', badge: '💗', base: '#ffffff', accent: '#ff5fa8', pattern: 'hearts', unlockStars: 2 },
  { id: 'stars', badge: '⭐', base: '#3b2d6b', accent: '#ffd84d', pattern: 'stars', unlockStars: 5 },
  { id: 'rainbow', badge: '🌈', base: '#ffffff', accent: '#7bd3ff', pattern: 'rainbow', unlockStars: 8 },
  { id: 'unicorn', badge: '🦄', base: '#fff0fb', accent: '#c07bff', pattern: 'unicorn', unlockStars: 12 },
]

export function princessById(id: string): Princess {
  return PRINCESSES.find((p) => p.id === id) ?? PRINCESSES[0]
}

export function ballById(id: string): BallSkin {
  return BALLS.find((b) => b.id === id) ?? BALLS[0]
}

/** Everything the child has not unlocked yet, cheapest first — used for the
 *  "next reward" teaser on the result screen. */
export function nextUnlock(stars: number): { badge: string; unlockStars: number } | null {
  const locked = [...PRINCESSES, ...BALLS]
    .filter((item) => item.unlockStars > stars)
    .sort((a, b) => a.unlockStars - b.unlockStars)
  return locked[0] ?? null
}
