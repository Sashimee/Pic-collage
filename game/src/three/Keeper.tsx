import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The goalkeeper: a small, friendly dragon. Deliberately *not* menacing — he
 * waves when he is beaten, and the whole point of him is to be beatable.
 *
 * The match loop drives `ref.position.x` and the dive lean; the flapping and
 * blinking live here.
 */
export function Keeper({ ref }: { ref: RefObject<THREE.Group | null> }) {
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const flap = Math.sin(t * 5) * 0.5
    if (wingL.current) wingL.current.rotation.z = 0.5 + flap
    if (wingR.current) wingR.current.rotation.z = -0.5 - flap
    if (body.current) body.current.position.y = Math.sin(t * 2.4) * 0.05
  })

  return (
    <group ref={ref} scale={1.3}>
      <group ref={body}>
        <mesh position={[0, 0.85, 0]} scale={[1, 1.15, 0.9]}>
          <sphereGeometry args={[0.62, 18, 16]} />
          <meshToonMaterial color="#7fd88f" />
        </mesh>
        <mesh position={[0, 0.72, 0.42]} scale={[0.8, 0.95, 0.5]}>
          <sphereGeometry args={[0.46, 14, 12]} />
          <meshToonMaterial color="#e8f9c9" />
        </mesh>

        {/* Snout and eyes face the shooter, who stands at +z. */}
        <mesh position={[0, 1.02, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.3, 10]} />
          <meshToonMaterial color="#6ccb7e" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.2, 1.28, 0.42]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.21, 1.28, 0.52]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial color="#2c2438" />
          </mesh>
        ))}

        {/* Little horns. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.22, 1.45, -0.05]} rotation={[0.3, 0, side * 0.25]}>
            <coneGeometry args={[0.07, 0.22, 8]} />
            <meshToonMaterial color="#ffd84d" />
          </mesh>
        ))}

        <group ref={wingL} position={[-0.55, 0.95, -0.1]}>
          <mesh position={[-0.28, 0, 0]} scale={[1, 0.7, 0.25]}>
            <sphereGeometry args={[0.34, 12, 10]} />
            <meshToonMaterial color="#a7e8b4" />
          </mesh>
        </group>
        <group ref={wingR} position={[0.55, 0.95, -0.1]}>
          <mesh position={[0.28, 0, 0]} scale={[1, 0.7, 0.25]}>
            <sphereGeometry args={[0.34, 12, 10]} />
            <meshToonMaterial color="#a7e8b4" />
          </mesh>
        </group>

        <mesh position={[0, 0.3, -0.55]} rotation={[-0.6, 0, 0]}>
          <capsuleGeometry args={[0.1, 0.45, 4, 8]} />
          <meshToonMaterial color="#7fd88f" />
        </mesh>

        {/* Feet, so he does not float. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.24, 0.14, 0.12]}>
            <capsuleGeometry args={[0.13, 0.1, 3, 8]} />
            <meshToonMaterial color="#6ccb7e" />
          </mesh>
        ))}
      </group>
    </group>
  )
}
