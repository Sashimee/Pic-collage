import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { ROUND } from '../game/constants'
import { useGame } from '../store/gameStore'
import { useSave } from '../store/saveStore'
import { nextUnlock } from '../data/roster'
import { useT } from '../i18n/useLang'
import { BigButton, Panel, StarRow } from './ui'

/**
 * The end of a round. It is written to be a celebration in every case — there
 * is no "you lost" state, only how much sparkle you got.
 */
export function ResultScreen() {
  const t = useT()
  const goals = useGame((s) => s.goals)
  const earnedStars = useGame((s) => s.earnedStars)
  const startRound = useGame((s) => s.startRound)
  const goWardrobe = useGame((s) => s.goWardrobe)
  const stars = useSave((s) => s.stars)

  const upcoming = nextUnlock(stars)

  useEffect(() => {
    if (earnedStars < ROUND.starsForPerfect) return
    // A perfect round deserves more than the per-goal confetti.
    confetti({
      particleCount: 200,
      spread: 150,
      startVelocity: 55,
      origin: { y: 0.5 },
      colors: ['#ff8ec7', '#ffd84d', '#8be0d0', '#c58cff', '#ffffff'],
      disableForReducedMotion: true,
    })
  }, [earnedStars])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm">
        <Panel>
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-4xl font-black text-white">{t('result.title')}</h2>

            <StarRow count={earnedStars} max={ROUND.starsForPerfect} size="lg" />

            <p className="text-2xl font-bold text-white/90">
              🥅 {goals} / {ROUND.shotsPerRound} {t('result.goals')}
            </p>

            <p className="text-lg font-semibold text-yellow-200">
              ⭐ {stars} {t('stars.total')}
            </p>

            {upcoming && (
              <p className="rounded-2xl bg-white/10 px-4 py-2 text-base font-semibold text-white/85">
                {t('result.next')} ⭐{upcoming.unlockStars} — {upcoming.badge}
              </p>
            )}

            <div className="mt-1 flex flex-col gap-3 self-stretch">
              <BigButton onClick={startRound}>⚽ {t('result.again')}</BigButton>
              <BigButton tone="secondary" onClick={goWardrobe}>
                👗 {t('result.wardrobe')}
              </BigButton>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
