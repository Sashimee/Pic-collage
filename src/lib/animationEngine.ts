// Animation engine: interpolate between keyframes (linear easing).
// Supports the same animatable properties as Konva transform attrs.

import type { CanvasElement } from '../types'

export type AnimatableProp = 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity'

export type TransitionType = 'linear' | 'fade' | 'slide' | 'zoom' | 'flip'

export interface Keyframe {
  id: string
  elementId: string
  time: number // seconds
  props: Partial<Record<AnimatableProp, number>>
  transition?: TransitionType // transition for the segment starting at this keyframe
}

const EASING: Record<TransitionType, (t: number) => number> = {
  linear: (t) => t,
  fade: (t) => t * t * (3 - 2 * t), // smoothstep ease-in-out
  slide: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
  zoom: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, // ease-in-out cubic
  flip: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, // ease-in-out quad
}

export interface FrameState {
  elementId: string
  props: Partial<Record<AnimatableProp, number>>
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Interpolate a single property between two keyframes. */
function interpolateProp(
  prev: number,
  next: number,
  prevTime: number,
  nextTime: number,
  time: number,
  transition: TransitionType = 'linear',
): number {
  if (nextTime === prevTime) return next
  const rawT = clamp((time - prevTime) / (nextTime - prevTime), 0, 1)
  const easedT = EASING[transition](rawT)
  return lerp(prev, next, easedT)
}

/**
 * Given elements + keyframes, compute the interpolated element states at `time`.
 * Only returns values for properties that have keyframes; the caller merges with
 * the current element state.
 */
export function getFrameState(
  elements: CanvasElement[],
  keyframes: Keyframe[],
  time: number,
): FrameState[] {
  const result: FrameState[] = []
  const byElement = new Map<string, Keyframe[]>()

  for (const kf of keyframes) {
    const arr = byElement.get(kf.elementId) ?? []
    arr.push(kf)
    byElement.set(kf.elementId, arr)
  }

  for (const el of elements) {
    const kfs = byElement.get(el.id)
    if (!kfs || kfs.length === 0) continue

    const sorted = kfs.slice().sort((a, b) => a.time - b.time)
    const props: Partial<Record<AnimatableProp, number>> = {}

    const animatableProps: AnimatableProp[] = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity']

    for (const prop of animatableProps) {
      // Collect keyframes that define this property
      const propFrames = sorted.filter((k) => k.props[prop] !== undefined)
      if (propFrames.length === 0) continue

      // Before first keyframe → hold first value
      if (time <= propFrames[0].time) {
        props[prop] = propFrames[0].props[prop]!
        continue
      }

      // After last keyframe → hold last value
      if (time >= propFrames[propFrames.length - 1].time) {
        props[prop] = propFrames[propFrames.length - 1].props[prop]!
        continue
      }

      // Find surrounding keyframes
      for (let i = 0; i < propFrames.length - 1; i++) {
        const prev = propFrames[i]
        const next = propFrames[i + 1]
        if (time >= prev.time && time < next.time) {
          const transition = next.transition ?? 'linear'
          props[prop] = interpolateProp(
            prev.props[prop]!,
            next.props[prop]!,
            prev.time,
            next.time,
            time,
            transition,
          )
          break
        }
      }
    }

    if (Object.keys(props).length > 0) {
      result.push({ elementId: el.id, props })
    }
  }

  return result
}

/** Yield frame states for every frame in the animation (generator). */
export function* generateAnimationFrames(
  elements: CanvasElement[],
  keyframes: Keyframe[],
  fps: number,
  duration: number,
): Generator<FrameState[]> {
  const frameCount = Math.ceil(duration * fps)
  for (let i = 0; i <= frameCount; i++) {
    const time = (i / frameCount) * duration
    yield getFrameState(elements, keyframes, time)
  }
}

/** Build a keyframe ID from element + time hash. */
export function makeKeyframeId(elementId: string, time: number): string {
  return `${elementId}@${time.toFixed(3)}`
}

/** Add or update a keyframe for an element at a specific time. */
export function upsertKeyframe(
  keyframes: Keyframe[],
  elementId: string,
  time: number,
  props: Partial<Record<AnimatableProp, number>>,
): Keyframe[] {
  const rounded = Math.round(time * 1000) / 1000
  const existingIdx = keyframes.findIndex(
    (k) => k.elementId === elementId && Math.abs(k.time - rounded) < 0.001,
  )
  const next: Keyframe = {
    id: makeKeyframeId(elementId, rounded),
    elementId,
    time: rounded,
    props,
  }
  if (existingIdx >= 0) {
    const copy = keyframes.slice()
    copy[existingIdx] = next
    return copy
  }
  return [...keyframes, next]
}

/** Remove a keyframe at the given time for an element. */
export function removeKeyframe(
  keyframes: Keyframe[],
  elementId: string,
  time: number,
): Keyframe[] {
  return keyframes.filter(
    (k) => !(k.elementId === elementId && Math.abs(k.time - time) < 0.001),
  )
}
