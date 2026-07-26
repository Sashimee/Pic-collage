import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Princess as PrincessData } from '../data/roster'

export type PrincessMode = 'idle' | 'kick' | 'celebrate'

/**
 * A princess built entirely from primitives — no .glb, no modelling tool, no
 * asset pipeline. Every distinctive feature is a colour or a flag on the roster
 * entry, so a new character is a data change.
 *
 * She is modelled facing **-z** (towards the goal), which is the direction she
 * plays in. On a goal she spins round to face the camera and cheers.
 */
export function Princess({
  data,
  mode = 'idle',
  showcase = false,
  position = [0, 0, 0],
}: {
  data: PrincessData
  mode?: PrincessMode
  /** Wardrobe/menu presentation: face the camera and turn slowly on the spot. */
  showcase?: boolean
  position?: [number, number, number]
}) {
  const root = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const clock = useRef(0)

  // Restart the animation whenever the mode changes, so a second goal in a row
  // replays the celebration instead of continuing mid-way through it.
  useEffect(() => {
    clock.current = 0
  }, [mode])

  useFrame((_, dt) => {
    clock.current += dt
    const t = clock.current
    const g = root.current
    if (!g) return

    if (showcase) {
      g.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.45
      g.position.y = position[1] + Math.sin(t * 1.6) * 0.04
      swing(armL, Math.sin(t * 1.6) * 0.12)
      swing(armR, -Math.sin(t * 1.6) * 0.12)
      return
    }

    if (mode === 'celebrate') {
      // Turn to face the camera, jump, arms in the air.
      g.rotation.y = damp(g.rotation.y, Math.PI, 6, dt)
      g.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.28
      const raise = Math.min(1, t * 4)
      swing(armL, -2.4 * raise + Math.sin(t * 9) * 0.2)
      swing(armR, -2.4 * raise - Math.sin(t * 9) * 0.2)
      swing(legL, 0)
      swing(legR, 0)
      return
    }

    g.rotation.y = damp(g.rotation.y, 0, 6, dt)

    if (mode === 'kick') {
      // A single forward swing of the right leg that settles back to standing.
      const swingT = Math.min(1, t / 0.42)
      const curve = Math.sin(swingT * Math.PI)
      swing(legR, -1.5 * curve)
      swing(legL, 0.25 * curve)
      swing(armL, 0.7 * curve)
      swing(armR, -0.5 * curve)
      g.position.y = position[1]
      return
    }

    // Idle: a small breath, and a bit of a sway.
    g.position.y = position[1] + Math.sin(t * 2) * 0.03
    g.rotation.z = Math.sin(t * 1.3) * 0.02
    swing(armL, Math.sin(t * 2) * 0.1)
    swing(armR, -Math.sin(t * 2) * 0.1)
    swing(legL, 0)
    swing(legR, 0)
  })

  return (
    <group ref={root} position={position}>
      {/* Legs pivot at the hip so the kick rotates from the right place. */}
      <group ref={legL} position={[-0.12, 0.38, 0]}>
        <Leg skin={data.skin} />
      </group>
      <group ref={legR} position={[0.12, 0.38, 0]}>
        <Leg skin={data.skin} />
      </group>

      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.48, 0.82, 16]} />
        <meshToonMaterial color={data.dress} />
      </mesh>
      {/* Hem trim. */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 20]} />
        <meshToonMaterial color={data.dressTrim} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.34, 12]} />
        <meshToonMaterial color={data.dressTrim} />
      </mesh>

      <group ref={armL} position={[-0.22, 1.3, 0]}>
        <Arm skin={data.skin} />
      </group>
      <group ref={armR} position={[0.22, 1.3, 0]}>
        <Arm skin={data.skin} />
      </group>

      <Head data={data} />
    </group>
  )
}

function Leg({ skin }: { skin: string }) {
  return (
    <>
      <mesh position={[0, -0.18, 0]}>
        <capsuleGeometry args={[0.085, 0.26, 3, 8]} />
        <meshToonMaterial color={skin} />
      </mesh>
      {/* Sparkly shoe, overlapping the ankle so the leg reads as one piece. */}
      <mesh position={[0, -0.33, -0.04]}>
        <boxGeometry args={[0.19, 0.12, 0.24]} />
        <meshToonMaterial color="#ffd84d" />
      </mesh>
    </>
  )
}

function Arm({ skin }: { skin: string }) {
  return (
    <mesh position={[0, -0.16, 0]}>
      <capsuleGeometry args={[0.055, 0.22, 3, 8]} />
      <meshToonMaterial color={skin} />
    </mesh>
  )
}

function Head({ data }: { data: PrincessData }) {
  return (
    <group position={[0, 1.62, 0]}>
      <mesh>
        <sphereGeometry args={[0.23, 20, 16]} />
        <meshToonMaterial color={data.skin} />
      </mesh>

      {/* Face — she is built facing -z, so features sit on the -z side. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.085, 0.03, -0.2]}>
          <sphereGeometry args={[0.033, 8, 8]} />
          <meshBasicMaterial color="#3b2b3f" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.145, -0.05, -0.175]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#ff9ec4" transparent opacity={0.75} />
        </mesh>
      ))}

      <Hair data={data} />
      <CrownHat color={data.crown} />
    </group>
  )
}

function Hair({ data }: { data: PrincessData }) {
  const cap = (
    <mesh position={[0, 0.05, 0.02]}>
      <sphereGeometry args={[0.245, 16, 14]} />
      <meshToonMaterial color={data.hair} />
    </mesh>
  )

  switch (data.hairStyle) {
    case 'buns':
      return (
        <group>
          {cap}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.24, 0.12, 0.05]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshToonMaterial color={data.hair} />
            </mesh>
          ))}
        </group>
      )
    case 'braid':
      return (
        <group>
          {cap}
          <mesh position={[0, -0.18, 0.2]}>
            <capsuleGeometry args={[0.07, 0.3, 3, 8]} />
            <meshToonMaterial color={data.hair} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group>
          {cap}
          <mesh position={[0, -0.2, 0.12]} scale={[1, 1.4, 0.7]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshToonMaterial color={data.hair} />
          </mesh>
        </group>
      )
    case 'curls':
      return (
        <group>
          {cap}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.2, 0.1 + Math.sin(a) * 0.1, 0.12]}>
                <sphereGeometry args={[0.11, 10, 10]} />
                <meshToonMaterial color={data.hair} />
              </mesh>
            )
          })}
        </group>
      )
  }
}

function CrownHat({ color }: { color: string }) {
  return (
    <group position={[0, 0.26, 0.02]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.028, 6, 14]} />
        <meshToonMaterial color={color} emissive="#6b5200" />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 0.085, 0.055, 0]}>
          <coneGeometry args={[0.035, 0.09, 6]} />
          <meshToonMaterial color={color} emissive="#6b5200" />
        </mesh>
      ))}
    </group>
  )
}

function swing(ref: React.RefObject<THREE.Group | null>, x: number) {
  if (ref.current) ref.current.rotation.x = x
}

/** Frame-rate independent approach to a target. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}
