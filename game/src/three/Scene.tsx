import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { PITCH } from '../game/constants'

/**
 * The shared 3D stage.
 *
 * Performance notes — the target is a school Chromebook or an old iPad at 60fps:
 *  - `dpr` is capped at 2; retina phones would otherwise render 3x the pixels.
 *  - no shadow maps anywhere (see BlobShadow), so there is a single render pass.
 *  - the sky is a CSS gradient behind a transparent canvas: free, and it scales
 *    to any screen without a skybox.
 */
export function Scene({ children, sky }: { children: ReactNode; sky: string }) {
  return (
    <div className="absolute inset-0" style={{ background: sky }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 4.2, 11], fov: 50, near: 0.1, far: 120 }}
      >
        <FitCamera />
        <hemisphereLight args={['#ffe9f6', '#5aa863', 1.05]} />
        <directionalLight position={[6, 12, 8]} intensity={1.15} color="#fff6e6" />
        {children}
      </Canvas>
    </div>
  )
}

/**
 * Keeps the whole goal on screen whatever the aspect ratio.
 *
 * A fixed vertical fov is wrong on a phone held upright: the horizontal field
 * narrows with the aspect ratio and the posts fall off the sides. This derives
 * the vertical fov from the horizontal angle the goal actually needs.
 */
function FitCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    // Half-width to keep visible at the goal line, plus a margin for the posts.
    // Keep this tight: on a portrait phone the vertical field is more than
    // twice the horizontal one, so every extra unit of side margin buys a big
    // band of empty sky.
    const targetHalfWidth = PITCH.goalHalfWidth + 1.0
    const distance = camera.position.z - PITCH.goalZ
    const halfHorizontal = Math.atan(targetHalfWidth / distance)
    const halfVertical = Math.atan(Math.tan(halfHorizontal) / aspect)

    camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(halfVertical) * 2, 34, 62)
    // Aim well below the crossbar so the frame fills with pitch rather than sky.
    camera.lookAt(0, 1.0, PITCH.goalZ + 5)
    camera.updateProjectionMatrix()
  }, [camera, size])

  return null
}
