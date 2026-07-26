import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PITCH } from '../game/constants'
import type { BallSkin } from '../data/roster'
import { ballTexture } from './textures'

export const TRAIL_LENGTH = 10

/**
 * The ball. Position and rotation are driven imperatively from the match loop
 * via `ref` — putting them in React state would re-render sixty times a second.
 */
export function Ball({ skin, ref }: { skin: BallSkin; ref: RefObject<THREE.Group | null> }) {
  const map = useMemo(() => ballTexture(skin), [skin])

  return (
    <group ref={ref} position={[PITCH.ballStart.x, PITCH.ballStart.y, PITCH.ballStart.z]}>
      <mesh>
        <sphereGeometry args={[PITCH.ballRadius, 24, 18]} />
        <meshToonMaterial map={map} />
      </mesh>
    </group>
  )
}

/**
 * A soft dark disc on the grass. Real shadow mapping costs a second render pass
 * over the whole scene; this costs one transparent circle, and in a flat
 * cartoon style it actually reads better.
 */
export function BlobShadow({ ref, radius = 0.34 }: { ref: RefObject<THREE.Mesh | null>; radius?: number }) {
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <circleGeometry args={[radius, 20]} />
      <meshBasicMaterial color="#2f7a3a" transparent opacity={0.28} depthWrite={false} />
    </mesh>
  )
}

/**
 * A short trail of shrinking sparkles behind the ball. The match loop pushes
 * recent positions into `history` (newest first); this only reads them.
 */
export function BallTrail({ history }: { history: RefObject<THREE.Vector3[]> }) {
  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    const points = history.current
    const meshes = group.current?.children as THREE.Mesh[] | undefined
    if (!meshes) return

    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i]
      const point = points[i]
      if (!point) {
        mesh.visible = false
        continue
      }
      mesh.visible = true
      mesh.position.copy(point)
      // Older samples sit further down the array: shrink and fade them out.
      const fade = 1 - i / meshes.length
      mesh.scale.setScalar(fade)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.6
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[PITCH.ballRadius * 0.42, 6, 6]} />
          <meshBasicMaterial color="#fff3b0" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
