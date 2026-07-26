import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PITCH, SHOT_TIMEOUT } from '../game/constants'
import type { Shot } from '../game/aim'
import { crossPlaneZ, makeBall, stepBall } from '../game/physics'
import type { BallState } from '../game/physics'
import { makeKeeper, startDive, stepKeeper } from '../game/keeper'
import type { KeeperState } from '../game/keeper'
import { evaluateCrossing } from '../game/scoring'
import type { ShotOutcome } from '../game/scoring'
import type { BallSkin, Princess as PrincessData } from '../data/roster'
import { Ball, BallTrail, BlobShadow, TRAIL_LENGTH } from './Ball'
import { Keeper } from './Keeper'
import { Princess } from './Princess'
import type { PrincessMode } from './Princess'

/** How long the ball is left on screen after a shot is judged. */
const SETTLE_TIME = 1.9

export interface MatchHandle {
  shoot: (shot: Shot) => void
  /** False while a shot is in flight or the round is over. */
  isReady: () => boolean
}

type Phase = 'aim' | 'flight' | 'settle'

interface Sim {
  ball: BallState
  keeper: KeeperState
  phase: Phase
  /** Seconds spent in the current phase. */
  t: number
  /** Set once the shot has been judged; drives the settle behaviour. */
  outcome: ShotOutcome | null
}

export function Match({
  api,
  princess,
  ballSkin,
  frozen,
  cheerUntil,
  onOutcome,
}: {
  api: RefObject<MatchHandle | null>
  princess: PrincessData
  ballSkin: BallSkin
  /** True once the round is over — no further shots are accepted. */
  frozen: boolean
  cheerUntil: RefObject<number>
  onOutcome: (outcome: ShotOutcome, target: string | null) => void
}) {
  const ballRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const keeperRef = useRef<THREE.Group>(null)
  const trail = useRef<THREE.Vector3[]>([])
  const [princessMode, setPrincessMode] = useState<PrincessMode>('idle')

  const sim = useRef<Sim>({ ball: makeBall(), keeper: makeKeeper(), phase: 'aim', t: 0, outcome: null })
  const spin = useMemo(() => new THREE.Quaternion(), [])
  const axis = useMemo(() => new THREE.Vector3(), [])
  /** Latest render clock, so non-frame code can schedule against it. */
  const now = useRef(0)

  // Mirrored into refs so the imperative handle below can be installed once
  // while still reading current values.
  const frozenRef = useRef(frozen)
  const outcomeCallback = useRef(onOutcome)
  useEffect(() => {
    frozenRef.current = frozen
    outcomeCallback.current = onOutcome
  }, [frozen, onOutcome])

  useEffect(() => {
    api.current = {
      isReady: () => sim.current.phase === 'aim' && !frozenRef.current,
      shoot: (shot) => {
        const s = sim.current
        if (s.phase !== 'aim' || frozenRef.current) return
        s.ball = { p: { ...PITCH.ballStart }, v: { ...shot.velocity }, spin: shot.spin, resting: false }
        s.phase = 'flight'
        s.t = 0
        s.outcome = null
        trail.current = []
        setPrincessMode('kick')
      },
    }
    return () => {
      api.current = null
    }
  }, [api])

  useFrame((state, rawDt) => {
    now.current = state.clock.elapsedTime
    // Guard only against the multi-second dt a backgrounded tab hands back.
    // The ceiling must stay well above a slow device's frame time: clamping to
    // 1/20s made everything below 20fps run in *slow motion* (the simulation
    // advanced less than real time every frame) instead of simply dropping
    // frames. stepBall sub-steps internally, so a big dt is still accurate.
    const dt = Math.min(rawDt, 0.25)
    const s = sim.current
    s.t += dt
    s.keeper = stepKeeper(s.keeper, dt)

    if (s.phase === 'flight' || s.phase === 'settle') {
      const previous = s.ball.p
      s.ball = stepBall(s.ball, dt)

      if (s.phase === 'flight') {
        const crossing = crossPlaneZ(previous, s.ball.p, PITCH.goalZ)
        if (crossing) {
          judge(s, crossing.x, crossing.y)
        } else if (s.t > SHOT_TIMEOUT || (s.ball.resting && s.t > 1.2)) {
          // Belt and braces: a shot that somehow never reaches the line still
          // has to end, or the child would be stuck with no shots left.
          settle(s, 'wide', null)
        }
      }

      // Once a goal is in, let the netting swallow the ball instead of having
      // it rattle around behind the goal.
      if (s.outcome === 'goal' && s.ball.p.z < PITCH.goalZ - 1.4) {
        s.ball.v.x *= 0.08
        s.ball.v.y *= 0.08
        s.ball.v.z *= 0.08
      }

      pushTrail(trail.current, s.ball.p)
    }

    if (s.phase === 'settle' && s.t > SETTLE_TIME) {
      s.phase = 'aim'
      s.t = 0
      s.outcome = null
      s.ball = makeBall()
      trail.current = []
      setPrincessMode('idle')
    }

    // --- push the simulation onto the scene graph -------------------------
    const ball = ballRef.current
    if (ball) {
      ball.position.set(s.ball.p.x, s.ball.p.y, s.ball.p.z)
      const speed = Math.hypot(s.ball.v.x, s.ball.v.y, s.ball.v.z)
      if (speed > 0.05) {
        // Roll about the axis perpendicular to the direction of travel.
        axis.set(s.ball.v.z, 0, -s.ball.v.x).normalize()
        spin.setFromAxisAngle(axis, (speed * dt) / PITCH.ballRadius)
        ball.quaternion.premultiply(spin)
      }
    }

    const shadow = shadowRef.current
    if (shadow) {
      shadow.position.set(s.ball.p.x, 0.02, s.ball.p.z)
      // Higher ball → bigger, fainter shadow.
      const height = Math.max(0, s.ball.p.y - PITCH.ballRadius)
      const spread = 1 + height * 0.16
      shadow.scale.setScalar(spread)
      ;(shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.3 - height * 0.03)
    }

    const keeper = keeperRef.current
    if (keeper) {
      keeper.position.set(s.keeper.x, 0, PITCH.goalZ + 0.55)
      const diving = s.keeper.diveDir !== 0
      const lean = diving ? s.keeper.diveDir * 0.75 : 0
      keeper.rotation.z = THREE.MathUtils.lerp(keeper.rotation.z, -lean, 0.25)
      keeper.position.x += diving ? s.keeper.diveDir * 0.5 : 0
    }
  })

  function judge(s: Sim, crossX: number, crossY: number) {
    const verdict = evaluateCrossing(crossX, crossY, s.keeper.x)
    // The dive is a *reaction*: it starts once the verdict is settled, so it can
    // never change the outcome (and can never make the game harder than the
    // difficulty harness measured).
    s.keeper = startDive(s.keeper, crossX)

    if (verdict.outcome === 'save') {
      // Punched clear, back towards the shooter.
      s.ball.v.z = Math.abs(s.ball.v.z) * 0.45
      s.ball.v.y = Math.abs(s.ball.v.y) * 0.4 + 2
      s.ball.spin = 0
    } else if (verdict.outcome === 'post') {
      s.ball.v.x *= -0.6
      s.ball.v.z = Math.abs(s.ball.v.z) * 0.35
      s.ball.spin = 0
    }

    settle(s, verdict.outcome, verdict.target)
  }

  function settle(s: Sim, outcome: ShotOutcome, target: string | null) {
    s.phase = 'settle'
    s.t = 0
    s.outcome = outcome
    setPrincessMode(outcome === 'goal' ? 'celebrate' : 'idle')
    if (outcome === 'goal') cheerUntil.current = now.current + 2.4
    outcomeCallback.current(outcome, target)
  }

  return (
    <group>
      <group scale={1.2}>
        <Princess data={princess} mode={princessMode} position={[-1.05, 0, PITCH.ballStart.z + 0.8]} />
      </group>
      <Keeper ref={keeperRef} />
      <Ball skin={ballSkin} ref={ballRef} />
      <BlobShadow ref={shadowRef} />
      <BallTrail history={trail} />
    </group>
  )
}

function pushTrail(history: THREE.Vector3[], p: { x: number; y: number; z: number }) {
  history.unshift(new THREE.Vector3(p.x, p.y, p.z))
  if (history.length > TRAIL_LENGTH) history.length = TRAIL_LENGTH
}
