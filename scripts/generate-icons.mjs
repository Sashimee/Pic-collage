// Generates the PWA PNG icons from scratch (no image libraries) so the build
// stays dependency-light. Draws the same "photo stack" mark as favicon.svg —
// the two files are meant to stay in lockstep, so edit them together.
// Run with: npm run generate:icons
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(OUT, { recursive: true })

// ---- tiny PNG encoder ----------------------------------------------------
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- the mark, in favicon.svg's 512-unit design space ---------------------
const D = 512

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]

const GRAD = [
  { at: 0, c: hex('#6366f1') },
  { at: 0.55, c: hex('#a855f7') },
  { at: 1, c: hex('#ec4899') },
]
const WHITE = [255, 255, 255]
const SHADOW = hex('#1e1b4b')
const SHOT_BG = hex('#eef2ff')
const SUN = hex('#fbbf24')
const RIDGE_BACK = hex('#6ee7b7')
const RIDGE_FRONT = hex('#10b981')

const TILE_R = 116

// Cards: centre, half-size, corner radius, rotation (degrees, screen sense).
const BACK_CARD = { cx: 222, cy: 246, half: 105, r: 26, rot: -12 }
const FRONT_CARD = { cx: 286, cy: 272, half: 119, r: 30, rot: 9 }
const SHOT_HALF = 99
const SHOT_R = 16

// Shadow plates, in front-card space: [halfW, halfH, radius, yOffset].
const SHADOW_PLATES = [
  [131, 131, 38, 12],
  [125, 127, 34, 8],
  [122, 124, 32, 5],
]
const SHADOW_ALPHA = 0.07

// Sun + ridges, in front-card space (origin at the card's centre).
const SUN_POS = { x: -46, y: -44, r: 25 }
const RIDGE_B = [
  [-99, 99],
  [-99, 58],
  [-41, -10],
  [-4, 28],
  [26, -14],
  [99, 58],
  [99, 99],
]
const RIDGE_F = [
  [-99, 99],
  [-99, 80],
  [-18, 28],
  [99, 80],
  [99, 99],
]

const lerp = (a, b, t) => a + (b - a) * t

function gradientAt(t) {
  for (let i = 1; i < GRAD.length; i++) {
    if (t <= GRAD[i].at || i === GRAD.length - 1) {
      const a = GRAD[i - 1]
      const b = GRAD[i]
      const k = Math.max(0, Math.min(1, (t - a.at) / (b.at - a.at)))
      return [lerp(a.c[0], b.c[0], k), lerp(a.c[1], b.c[1], k), lerp(a.c[2], b.c[2], k)]
    }
  }
  return GRAD[0].c
}

/** Signed test for an axis-aligned rounded rect centred on the origin. */
function inRoundRect(x, y, halfW, halfH, r) {
  const ax = Math.abs(x)
  const ay = Math.abs(y)
  if (ax > halfW || ay > halfH) return false
  const cx = halfW - r
  const cy = halfH - r
  if (ax <= cx || ay <= cy) return true
  return Math.hypot(ax - cx, ay - cy) <= r
}

function inPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Rotate a design-space point into a card's local frame. */
function toCard(x, y, card) {
  const a = (-card.rot * Math.PI) / 180
  const dx = x - card.cx
  const dy = y - card.cy
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }
}

const over = (dst, src, alpha) => [
  lerp(dst[0], src[0], alpha),
  lerp(dst[1], src[1], alpha),
  lerp(dst[2], src[2], alpha),
]

/**
 * Colour of one sample in design space. Returns null outside the tile so the
 * non-maskable icons keep their rounded silhouette.
 */
function sample(x, y, maskable) {
  if (!maskable && !inRoundRect(x - D / 2, y - D / 2, D / 2, D / 2, TILE_R)) return null

  let col = gradientAt((x + y) / (2 * D))

  const back = toCard(x, y, BACK_CARD)
  if (inRoundRect(back.x, back.y, BACK_CARD.half, BACK_CARD.half, BACK_CARD.r)) {
    col = over(col, WHITE, 0.5)
  }

  const front = toCard(x, y, FRONT_CARD)
  for (const [hw, hh, r, dy] of SHADOW_PLATES) {
    if (inRoundRect(front.x, front.y - dy, hw, hh, r)) col = over(col, SHADOW, SHADOW_ALPHA)
  }

  if (!inRoundRect(front.x, front.y, FRONT_CARD.half, FRONT_CARD.half, FRONT_CARD.r)) return col
  col = WHITE

  if (!inRoundRect(front.x, front.y, SHOT_HALF, SHOT_HALF, SHOT_R)) return col
  col = SHOT_BG
  if (inPoly(front.x, front.y, RIDGE_B)) col = RIDGE_BACK
  if (inPoly(front.x, front.y, RIDGE_F)) col = RIDGE_FRONT
  if (Math.hypot(front.x - SUN_POS.x, front.y - SUN_POS.y) <= SUN_POS.r) col = SUN
  return col
}

const SS = 3 // supersampling factor per axis

function drawIcon(N, { maskable }) {
  const buf = Buffer.alloc(N * N * 4)
  // Maskable icons must survive an aggressive circular crop, so shrink the
  // motif toward the centre and let the gradient bleed to the edges.
  const motif = maskable ? 0.74 : 1
  const toDesign = (p) => {
    const u = ((p / N) * D - D / 2) / motif + D / 2
    return u
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = toDesign(x + (sx + 0.5) / SS)
          const dy = toDesign(y + (sy + 0.5) / SS)
          // Maskable variants keep the gradient full-bleed: clamp the sample so
          // the shrunken motif still sits on a solid background.
          const col = sample(dx, dy, maskable)
          if (col) {
            r += col[0]
            g += col[1]
            b += col[2]
            a += 1
          }
        }
      }
      const n = SS * SS
      const i = (y * N + x) * 4
      if (a === 0) {
        buf[i] = buf[i + 1] = buf[i + 2] = buf[i + 3] = 0
      } else {
        buf[i] = Math.round(r / a)
        buf[i + 1] = Math.round(g / a)
        buf[i + 2] = Math.round(b / a)
        buf[i + 3] = Math.round((a / n) * 255)
      }
    }
  }
  return encodePNG(N, N, buf)
}

const targets = [
  { file: 'pwa-192x192.png', N: 192, maskable: false },
  { file: 'pwa-512x512.png', N: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', N: 512, maskable: true },
  { file: 'apple-touch-icon.png', N: 180, maskable: true },
]
for (const t of targets) {
  writeFileSync(resolve(OUT, t.file), drawIcon(t.N, { maskable: t.maskable }))
  console.log('wrote', t.file)
}
