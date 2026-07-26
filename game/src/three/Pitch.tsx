import { useMemo } from 'react'
import * as THREE from 'three'
import { PITCH } from '../game/constants'
import { TARGETS } from '../game/scoring'
import { grassTexture, netTexture } from './textures'

/**
 * The stadium: grass, goal, netting and the bonus crowns. Everything here is
 * static — it is built once and never re-renders, so the per-frame cost is just
 * the draw calls.
 */
export function Pitch() {
  const grass = useMemo(() => grassTexture(), [])
  const net = useMemo(() => netTexture(), [])

  const { goalZ, goalHalfWidth, goalHeight, postRadius } = PITCH

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[46, 60]} />
        <meshLambertMaterial map={grass} />
      </mesh>

      {/* Penalty arc and spot, painted flat on the grass. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, PITCH.ballStart.z]}>
        <circleGeometry args={[0.22, 20]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, goalZ + 0.05]}>
        <ringGeometry args={[9.4, 9.6, 48, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <Goal goalZ={goalZ} halfWidth={goalHalfWidth} height={goalHeight} postRadius={postRadius} net={net} />

      {TARGETS.map((t) => (
        <Crown key={t.id} x={t.x} y={t.y} z={goalZ + 0.35} radius={t.radius} />
      ))}

      <Stands />
      <Castle />
    </group>
  )
}

/**
 * A castle skyline behind the goal.
 *
 * It is not only decoration: on a portrait phone the vertical field of view is
 * more than twice the horizontal one, so fitting the goal across the width
 * leaves a tall band above it. Towers fill that band with the game's own
 * subject matter instead of empty sky.
 */
function Castle() {
  // Distance sets the rules here. At z = goalZ - 26 the camera only sees about
  // ±10 units across, so the towers have to sit close to the centre line — and
  // straddle it rather than stand on it, leaving the goal mouth clear.
  const z = PITCH.goalZ - 26
  const towers: { x: number; height: number; radius: number; roof: string }[] = [
    { x: -9.2, height: 8.5, radius: 1.1, roof: '#a855f7' },
    { x: -4.6, height: 11.5, radius: 1.25, roof: '#ec4899' },
    { x: 4.6, height: 11.5, radius: 1.25, roof: '#ec4899' },
    { x: 9.2, height: 8.5, radius: 1.1, roof: '#a855f7' },
  ]

  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[46, 7, 2]} />
        <meshLambertMaterial color="#cdb0ea" />
      </mesh>
      {/* Crenellations along the rampart. */}
      {Array.from({ length: 23 }, (_, i) => (
        <mesh key={i} position={[-22 + i * 2, 7.45, 0]}>
          <boxGeometry args={[1, 0.9, 2.1]} />
          <meshLambertMaterial color="#cdb0ea" />
        </mesh>
      ))}

      {towers.map((t) => (
        <group key={t.x} position={[t.x, 0, 0]}>
          <mesh position={[0, t.height / 2, 0]}>
            <cylinderGeometry args={[t.radius, t.radius * 1.08, t.height, 12]} />
            <meshLambertMaterial color="#e3ccf7" />
          </mesh>
          <mesh position={[0, t.height + t.radius * 1.1, 0]}>
            <coneGeometry args={[t.radius * 1.35, t.radius * 2.2, 12]} />
            <meshLambertMaterial color={t.roof} />
          </mesh>
          {/* Flagpole and pennant. The pole matters: without it the flag reads
              as a yellow rectangle floating in the sky. */}
          <mesh position={[0, t.height + t.radius * 2.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, t.radius * 1.1, 6]} />
            <meshBasicMaterial color="#f5e9c8" />
          </mesh>
          <mesh position={[t.radius * 0.55, t.height + t.radius * 2.85, 0]}>
            <boxGeometry args={[t.radius * 1.1, 0.45, 0.06]} />
            <meshBasicMaterial color="#ffd84d" />
          </mesh>
          {/* Windows, so the towers do not read as blank cylinders. */}
          {[0.5, 0.75].map((f) => (
            <mesh key={f} position={[0, t.height * f, t.radius * 0.98]}>
              <boxGeometry args={[0.4, 0.66, 0.08]} />
              <meshBasicMaterial color="#7c3aed" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Goal({
  goalZ,
  halfWidth,
  height,
  postRadius,
  net,
}: {
  goalZ: number
  halfWidth: number
  height: number
  postRadius: number
  net: THREE.Texture
}) {
  const post = <cylinderGeometry args={[postRadius, postRadius, height, 10]} />
  return (
    <group position={[0, 0, goalZ]}>
      <mesh position={[-halfWidth, height / 2, 0]}>
        {post}
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh position={[halfWidth, height / 2, 0]}>
        {post}
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[postRadius, postRadius, halfWidth * 2, 10]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Back and side netting, angled away from the goal line. */}
      <mesh position={[0, height / 2, -2.2]}>
        <planeGeometry args={[halfWidth * 2, height]} />
        <meshLambertMaterial map={net} transparent side={THREE.DoubleSide} color="#ffd9f0" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * halfWidth, height / 2, -1.1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.2, height]} />
          <meshLambertMaterial map={net} transparent side={THREE.DoubleSide} color="#ffd9f0" />
        </mesh>
      ))}
    </group>
  )
}

/** A bonus crown hanging in the goal mouth. Hitting one is worth a star. */
function Crown({ x, y, z, radius }: { x: number; y: number; z: number; radius: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <torusGeometry args={[radius * 0.62, radius * 0.13, 8, 20]} />
        <meshToonMaterial color="#ffd84d" emissive="#8a6a00" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius * 0.62, Math.sin(a) * radius * 0.62, 0]}>
            <sphereGeometry args={[radius * 0.16, 8, 8]} />
            <meshToonMaterial color="#fff2b0" emissive="#8a6a00" />
          </mesh>
        )
      })}
    </group>
  )
}

/** Low candy-coloured stands framing the pitch, purely decorative. */
function Stands() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (PITCH.pitchHalfWidth + 1.5), 0.9, -6]}>
          <boxGeometry args={[3, 1.8, 34]} />
          <meshLambertMaterial color={side < 0 ? '#c58cff' : '#8cd0ff'} />
        </mesh>
      ))}
      <mesh position={[0, 1.4, PITCH.goalZ - 4.5]}>
        <boxGeometry args={[26, 2.8, 3]} />
        <meshLambertMaterial color="#ff9ed2" />
      </mesh>
    </group>
  )
}
