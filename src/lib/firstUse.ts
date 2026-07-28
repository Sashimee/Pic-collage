/**
 * "Has this person seen this hint yet?", in one place.
 *
 * The app had grown a bespoke localStorage key per hint — one for onboarding,
 * one for the pinch tip, one for the install nudge — which does not scale to a
 * tutorial per tool. One record instead, because:
 *
 * - `ErrorBoundary` clears localStorage wholesale on reset, and a single key is
 *   one thing to lose rather than ten;
 * - the e2e suite has to suppress every hint before it can test anything, and
 *   almost every spec routes through the same helper. One key is a one-line
 *   change there; the first key someone forgets breaks the specs that drive the
 *   very tools being taught.
 */

const KEY = 'pic-collage-tips-v1'

/** Hints that predate this registry, mapped to their new ids. */
const LEGACY_KEYS: Record<string, string> = {
  'pic-collage-onboarded-v2': 'welcome',
  'piccollage-pinch-hint-shown': 'pinch',
}

export type TipRecord = Record<string, number>

/**
 * Storage is optional everywhere here. Private mode throws on write, and jsdom
 * under Node 26 has no `localStorage` at all — a hint failing to persist should
 * cost the user a repeated tip, never a crash.
 */
function read(): TipRecord {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? (parsed as TipRecord) : {}
  } catch {
    return {}
  }
}

function write(record: TipRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    /* storage blocked — the tip simply shows again next time */
  }
}

/**
 * Fold the old one-key-per-hint flags in, once.
 *
 * Without this everyone who has already dismissed onboarding gets taught it
 * again the first time they open the new build, which is a worse first
 * impression than never having had tips at all.
 */
function migrate(record: TipRecord): TipRecord {
  let changed = false
  for (const [oldKey, id] of Object.entries(LEGACY_KEYS)) {
    if (record[id]) continue
    try {
      if (localStorage.getItem(oldKey)) {
        record[id] = 1
        changed = true
      }
    } catch {
      /* nothing to migrate from */
    }
  }
  if (changed) write(record)
  return record
}

/** Has this hint been seen? Does not mark it. */
export function hasSeen(id: string): boolean {
  return !!migrate(read())[id]
}

/** Mark a hint as seen. Idempotent. */
export function markSeen(id: string): void {
  const record = migrate(read())
  if (record[id]) return
  record[id] = Date.now()
  write(record)
}

/**
 * True at most once ever, and it claims the flag as it answers.
 *
 * Claiming on read rather than after showing is deliberate: React's StrictMode
 * invokes effects twice in development, and a check that only writes later
 * would answer `true` both times and show the hint twice. `shouldNudgeInstall`
 * in App.tsx already works this way.
 */
export function claimFirstUse(id: string): boolean {
  const record = migrate(read())
  if (record[id]) return false
  record[id] = Date.now()
  write(record)
  return true
}

/** Forget everything, so the tips play again. Wired to a Settings control. */
export function resetTips(): void {
  try {
    localStorage.removeItem(KEY)
    for (const oldKey of Object.keys(LEGACY_KEYS)) localStorage.removeItem(oldKey)
  } catch {
    /* nothing to clear */
  }
}

/** Everything seen so far — for tests and the Settings summary. */
export function seenTips(): TipRecord {
  return migrate(read())
}
