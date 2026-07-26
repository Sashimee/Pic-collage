import { useCallback, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { sfx } from '../audio/sfx'
import { ROUND } from '../game/constants'
import type { ShotOutcome } from '../game/scoring'
import { outcomeMessageKey } from '../game/scoring'
import { useGame } from '../store/gameStore'
import { useSave } from '../store/saveStore'
import { ballById, princessById } from '../data/roster'
import { useT } from '../i18n/useLang'
import { Scene } from '../three/Scene'
import { Pitch } from '../three/Pitch'
import { Crowd } from '../three/Crowd'
import { Match } from '../three/Match'
import type { MatchHandle } from '../three/Match'
import { AimOverlay } from './AimOverlay'
import { ResultScreen } from './ResultScreen'
import { IconButton } from './ui'

const SKY = 'linear-gradient(180deg, #7fd1ff 0%, #c9e9ff 45%, #ffe6f4 100%)'

export function PlayScreen() {
  const t = useT()
  const api = useRef<MatchHandle | null>(null)
  const cheerUntil = useRef(0)

  const princess = useSave((s) => princessById(s.princessId))
  const ballSkin = useSave((s) => ballById(s.ballId))
  const addStars = useSave((s) => s.addStars)

  const screen = useGame((s) => s.screen)
  const shotsTaken = useGame((s) => s.shotsTaken)
  const goals = useGame((s) => s.goals)
  const earnedStars = useGame((s) => s.earnedStars)
  const recordShot = useGame((s) => s.recordShot)
  const finishRound = useGame((s) => s.finishRound)
  const goHome = useGame((s) => s.goHome)

  const roundOver = shotsTaken >= ROUND.shotsPerRound
  const awarded = useRef(false)

  const handleOutcome = useCallback(
    (outcome: ShotOutcome, target: string | null) => {
      recordShot(outcome, target)
      if (outcome === 'goal') {
        sfx.goal()
        burst()
        if (target) {
          sfx.crown()
          burst(0.35)
        }
      } else if (outcome === 'post') {
        sfx.post()
      } else {
        sfx.save()
      }
    },
    [recordShot],
  )

  // Let the last celebration play out before the result panel slides in.
  useEffect(() => {
    if (!roundOver || screen !== 'play' || awarded.current) return
    awarded.current = true
    const id = window.setTimeout(() => {
      addStars(earnedStars)
      sfx.star()
      finishRound()
    }, 1900)
    return () => window.clearTimeout(id)
  }, [roundOver, screen, earnedStars, addStars, finishRound])

  // Re-arm for the next round. PlayScreen stays mounted across "Again!", so a
  // mount-only reset would silently stop awarding stars from round two onwards.
  useEffect(() => {
    if (shotsTaken === 0) awarded.current = false
  }, [shotsTaken])

  return (
    <div className="absolute inset-0">
      <Scene sky={SKY}>
        <Pitch />
        <Crowd cheerUntil={cheerUntil} />
        <Match
          api={api}
          princess={princess}
          ballSkin={ballSkin}
          frozen={roundOver}
          cheerUntil={cheerUntil}
          onOutcome={handleOutcome}
        />
      </Scene>

      {screen === 'play' && (
        <AimOverlay
          hint={t('play.hint')}
          canShoot={() => api.current?.isReady() ?? false}
          onShoot={(shot) => {
            sfx.kick()
            api.current?.shoot(shot)
          }}
        />
      )}

      <Hud shotsTaken={shotsTaken} goals={goals} onQuit={goHome} />
      <Shout />

      {screen === 'result' && <ResultScreen />}
    </div>
  )
}

function Hud({ shotsTaken, goals, onQuit }: { shotsTaken: number; goals: number; onQuit: () => void }) {
  const stars = useSave((s) => s.stars)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
      <div className="pointer-events-auto">
        <IconButton label="Menu" onClick={onQuit}>
          🏠
        </IconButton>
      </div>

      <div className="flex flex-col items-end gap-2">
        {/* Shots remaining, as balls. No numbers needed to read it. */}
        <div data-testid="shots" className="flex gap-1 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm" role="img"
          aria-label={`${ROUND.shotsPerRound - shotsTaken} / ${ROUND.shotsPerRound}`}>
          {Array.from({ length: ROUND.shotsPerRound }, (_, i) => (
            <span key={i} className={`text-2xl ${i < shotsTaken ? 'opacity-25 grayscale' : ''}`}>
              ⚽
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-full bg-black/30 px-4 py-2 backdrop-blur-sm">
          <span className="text-2xl font-black text-white">🥅 {goals}</span>
          <span className="text-2xl font-black text-yellow-200">⭐ {stars}</span>
        </div>
      </div>
    </div>
  )
}

/** The big shout after each shot. Keyed on shoutId so it replays every time. */
function Shout() {
  const t = useT()
  const outcome = useGame((s) => s.lastOutcome)
  const shoutId = useGame((s) => s.shoutId)
  const clearShout = useGame((s) => s.clearShout)

  useEffect(() => {
    if (!outcome) return
    const id = window.setTimeout(clearShout, 1500)
    return () => window.clearTimeout(id)
  }, [outcome, shoutId, clearShout])

  if (!outcome) return null

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p
        key={shoutId}
        className="animate-pop-in text-center text-6xl font-black tracking-tight text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
      >
        {outcome === 'goal' ? '🎉 ' : ''}
        {t(outcomeMessageKey(outcome))}
      </p>
    </div>
  )
}

/** Party colours, aimed up from the bottom of the screen. */
function burst(scale = 1) {
  confetti({
    particleCount: Math.round(90 * scale),
    spread: 95,
    startVelocity: 45,
    origin: { y: 0.75 },
    colors: ['#ff8ec7', '#ffd84d', '#8be0d0', '#c58cff', '#ffffff'],
    disableForReducedMotion: true,
  })
}
