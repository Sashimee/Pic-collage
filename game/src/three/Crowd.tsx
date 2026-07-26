import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PITCH } from '../game/constants'

const COUNT = 132
const COLORS = ['#ff8ec7', '#ffd84d', '#8be0d0', '#c58cff', '#ffb35c', '#9ec9ff', '#ff6b8b']

interface Spectator {
  x: number
  y: number
  z: number
  color: THREE.Color
  phase: number
  height: number
}

/**
 * The crowd is a single InstancedMesh — 132 spectators for one draw call. They
 * bob on individual sine phases, and `cheer` makes them all jump, which is the
 * cheapest possible way to make a goal feel like an event.
 */
export function Crowd({ cheerUntil }: { cheerUntil: React.RefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const people = useMemo<Spectator[]>(() => {
    // Deterministic layout: the stands look the same every launch.
    let seed = 42
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }

    const out: Spectator[] = []
    for (let i = 0; i < COUNT; i++) {
      const backStand = i % 3 === 0
      const side = rand() < 0.5 ? -1 : 1
      out.push({
        x: backStand ? (rand() - 0.5) * 24 : side * (PITCH.pitchHalfWidth + 0.6 + rand() * 2.2),
        y: backStand ? 3.1 : 2.1,
        z: backStand ? PITCH.goalZ - 4.2 : -6 + (rand() - 0.5) * 32,
        color: new THREE.Color(COLORS[Math.floor(rand() * COLORS.length)]),
        phase: rand() * Math.PI * 2,
        height: 0.75 + rand() * 0.3,
      })
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    people.forEach((p, i) => mesh.setColorAt(i, p.color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [people])

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    const cheering = t < cheerUntil.current

    for (let i = 0; i < people.length; i++) {
      const p = people[i]
      const wave = Math.sin(t * (cheering ? 9 : 2.2) + p.phase)
      const hop = cheering ? Math.abs(wave) * 0.5 : wave * 0.06
      dummy.position.set(p.x, p.y + hop, p.z)
      dummy.scale.setScalar(p.height)
      dummy.rotation.z = cheering ? wave * 0.25 : 0
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
      <meshLambertMaterial />
    </instancedMesh>
  )
}
