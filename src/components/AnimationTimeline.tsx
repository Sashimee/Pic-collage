import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import {
  getFrameState,
  upsertKeyframe,
  removeKeyframe,
  type Keyframe,
  type AnimatableProp,
} from '../lib/animationEngine'
import type { CanvasElement } from '../types'
import { m } from './motion'
import { useT } from '../i18n/useLang'

const ANIMATABLE_PROPS: AnimatableProp[] = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity']
const DEFAULT_DURATION = 5 // seconds

function elementLabel(el: CanvasElement): string {
  switch (el.type) {
    case 'photo':
      return '📷 Photo'
    case 'text':
      return '📝 Text'
    case 'sticker':
      return '😀 Sticker'
    case 'drawing':
      return '✏️ Drawing'
    case 'shape':
      return '🔷 Shape'
    case 'group':
      return '📁 Group'
    default:
      return 'Element'
  }
}

function getElementProp(el: CanvasElement, prop: AnimatableProp): number {
  switch (prop) {
    case 'x':
      return el.x
    case 'y':
      return el.y
    case 'rotation':
      return el.rotation
    case 'scaleX':
      return el.scaleX
    case 'scaleY':
      return el.scaleY
    case 'opacity':
      return el.opacity ?? 1
    default:
      return 0
  }
}

export default function AnimationTimeline() {
  const t = useT()
  const elements = useEditor((s) => s.elements)

  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [selectedProp, setSelectedProp] = useState<AnimatableProp>('x')
  const [draggingPlayhead, setDraggingPlayhead] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const playStartTimeRef = useRef<number>(0)
  const playStartCurrentRef = useRef<number>(0)

  // Apply frame state to elements (silent — no history)
  const applyFrame = useCallback(
    (time: number) => {
      const frameStates = getFrameState(elements, keyframes, time)
      if (frameStates.length === 0) return
      const nextElements = elements.map((el) => {
        const fs = frameStates.find((f) => f.elementId === el.id)
        if (!fs) return el
        return { ...el, ...fs.props } as CanvasElement
      })
      useEditor.setState({ elements: nextElements })
    },
    [elements, keyframes],
  )

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    playStartTimeRef.current = performance.now()
    playStartCurrentRef.current = currentTime

    const loop = (now: number) => {
      if (!isPlaying) return
      const elapsed = (now - playStartTimeRef.current) / 1000
      let t = playStartCurrentRef.current + elapsed
      if (t >= duration) {
        t = duration
        setIsPlaying(false)
      }
      setCurrentTime(t)
      applyFrame(t)
      if (t < duration) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, duration, currentTime, applyFrame])

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handlePlay = () => {
    if (currentTime >= duration) setCurrentTime(0)
    setIsPlaying(true)
  }
  const handlePause = () => setIsPlaying(false)
  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    // Restore original elements from keyframe-less state would require snapshot;
    // for now we just reset time.
  }

  const timeToPx = (t: number, width: number): number => (t / duration) * width
  const pxToTime = (px: number, width: number): number => {
    const t = (px / width) * duration
    return Math.max(0, Math.min(duration, t))
  }

  const handleTimelineClick = (e: React.MouseEvent, elementId: string) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = pxToTime(x, rect.width)

    // Check if clicking near an existing keyframe (±8px)
    const elementKfs = keyframes.filter((k) => k.elementId === elementId)
    const near = elementKfs.find(
      (k) => Math.abs(timeToPx(k.time, rect.width) - x) < 12,
    )

    if (near) {
      setKeyframes((prev) => removeKeyframe(prev, elementId, near.time))
    } else {
      const el = elements.find((e2) => e2.id === elementId)
      if (!el) return
      const props: Partial<Record<AnimatableProp, number>> = {
        [selectedProp]: getElementProp(el, selectedProp),
      }
      setKeyframes((prev) => upsertKeyframe(prev, elementId, time, props))
    }
  }

  const handleScrub = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = pxToTime(x, rect.width)
      setCurrentTime(time)
      applyFrame(time)
    },
    [duration, applyFrame],
  )

  const onMouseDownPlayhead = () => {
    setDraggingPlayhead(true)
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!draggingPlayhead) return
    const onMove = (e: MouseEvent) => handleScrub(e)
    const onUp = () => setDraggingPlayhead(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [draggingPlayhead, handleScrub])

  const tickCount = Math.ceil(duration)
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i)

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <m.button
          whileTap={{ scale: 0.9 }}
          onClick={isPlaying ? handlePause : handlePlay}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </m.button>
        <m.button
          whileTap={{ scale: 0.9 }}
          onClick={handleStop}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text hover:bg-surface-3"
          title={t('animation.stop')}
        >
          <Square size={16} />
        </m.button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted">Duration (s):</label>
          <input
            type="number"
            min={1}
            max={60}
            step={0.5}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-text"
          />
          <select
            value={selectedProp}
            onChange={(e) => setSelectedProp(e.target.value as AnimatableProp)}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-text"
          >
            {ANIMATABLE_PROPS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="text-xs tabular-nums text-muted">
            {currentTime.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Time ruler */}
        <div className="relative flex h-6 shrink-0 select-none">
          <div className="w-28 shrink-0" /> {/* spacer matching element list width */}
          <div
            ref={timelineRef}
            className="relative flex-1 cursor-pointer"
            onMouseDown={(e) => {
              handleScrub(e)
              onMouseDownPlayhead()
            }}
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute top-0 flex flex-col items-center"
                style={{
                  left: `${(t / duration) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="text-[0.6rem] text-muted">{t}s</span>
                <div className="mt-0.5 h-1.5 w-px bg-border" />
              </div>
            ))}
            {/* Playhead */}
            <div
              className="absolute top-0 z-10 h-full w-px bg-accent"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-accent" />
            </div>
          </div>
        </div>

        {/* Element rows */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {elements.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-xs text-muted">
              Add elements to the canvas to create keyframes.
            </div>
          )}
          {elements.map((el) => {
            const elKfs = keyframes.filter((k) => k.elementId === el.id)
            return (
              <div key={el.id} className="flex h-10 items-center border-b border-border">
                {/* Element label */}
                <div className="w-28 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-2 text-xs text-text">
                  {elementLabel(el)}
                </div>
                {/* Keyframe track */}
                <div
                  className="relative flex-1 cursor-pointer self-stretch"
                  onClick={(e) => handleTimelineClick(e, el.id)}
                >
                  {/* Track line */}
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                  {/* Diamond markers */}
                  {elKfs.map((kf) => (
                    <m.div
                      key={kf.id}
                      whileTap={{ scale: 0.8 }}
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-accent shadow-sm"
                      style={{
                        left: `${(kf.time / duration) * 100}%`,
                        marginLeft: '-5px',
                      }}
                      title={`${kf.time.toFixed(2)}s — ${Object.keys(kf.props).join(', ')}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
