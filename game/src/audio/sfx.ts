/**
 * All sound is synthesised with the Web Audio API — no audio files, so the game
 * stays a handful of small text assets and works offline from the first load.
 *
 * The palette is deliberately soft: short, low-ish, no harsh transients. This is
 * played by small children, often with the tablet close to their face.
 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean) {
  muted = value
}

/**
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily on the first sound (which always follows a tap) and resumed if the OS
 * suspended it while the tab was in the background.
 */
function audio(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  type?: OscillatorType
  from: number
  to?: number
  duration: number
  gain?: number
  delay?: number
}

function tone({ type = 'sine', from, to, duration, gain = 0.18, delay = 0 }: ToneOptions) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration)

  // A short attack and a full decay to zero: no clicks at either end.
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noise(duration: number, gain: number, filterHz: number, delay = 0) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const frames = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    // Fade the noise out across the buffer so it swells rather than cuts.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }

  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterHz
  const amp = ac.createGain()
  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  src.connect(filter).connect(amp).connect(ac.destination)
  src.start(t0)
}

export const sfx = {
  kick() {
    tone({ type: 'triangle', from: 320, to: 90, duration: 0.16, gain: 0.22 })
    noise(0.09, 0.12, 1600)
  },

  /** Rising arpeggio + crowd swell. The single most important sound here. */
  goal() {
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => tone({ type: 'triangle', from: f, duration: 0.28, gain: 0.16, delay: i * 0.075 }))
    noise(1.1, 0.09, 900, 0.1)
  },

  /** Bright and short — a crown is a bonus, not a second goal. */
  crown() {
    ;[880, 1175, 1568].forEach((f, i) =>
      tone({ type: 'sine', from: f, duration: 0.18, gain: 0.13, delay: i * 0.05 }),
    )
  },

  /**
   * Deliberately *not* a failure sound: a soft two-note "oh well" that curves
   * back up. Nothing in this game is allowed to sound like a punishment.
   */
  save() {
    tone({ type: 'sine', from: 420, to: 300, duration: 0.18, gain: 0.14 })
    tone({ type: 'sine', from: 330, to: 400, duration: 0.22, gain: 0.12, delay: 0.16 })
  },

  post() {
    tone({ type: 'square', from: 900, to: 700, duration: 0.1, gain: 0.1 })
  },

  whistle() {
    tone({ type: 'square', from: 1900, to: 2100, duration: 0.18, gain: 0.07 })
  },

  tap() {
    tone({ type: 'sine', from: 660, to: 880, duration: 0.09, gain: 0.12 })
  },

  star() {
    ;[659, 880, 1319].forEach((f, i) =>
      tone({ type: 'triangle', from: f, duration: 0.3, gain: 0.14, delay: i * 0.14 }),
    )
  },
}
