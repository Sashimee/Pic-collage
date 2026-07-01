// Generates the PWA PNG icons from scratch (no image libraries) so the build
// stays dependency-light. Draws a branded gradient tile with a "photo stack"
// motif matching favicon.svg. Run with: node scripts/generate-icons.mjs
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

// ---- drawing -------------------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t
const C = {
  a: [99, 102, 241], // indigo
  b: [236, 72, 153], // pink
  white: [255, 255, 255],
  sun: [251, 191, 36],
  hill: [52, 211, 153],
}

function pointInPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

function drawIcon(N, { maskable }) {
  const buf = Buffer.alloc(N * N * 4)
  const motif = maskable ? 0.74 : 1
  const s = (c) => 0.5 * N + (c - 0.5 * N) * motif // scale motif toward centre
  const rad = N * 0.22
  const px = { x0: s(0.28 * N), y0: s(0.3 * N), x1: s(0.72 * N), y1: s(0.7 * N) }
  const corner = N * 0.04 * motif
  const sun = { cx: s(0.4 * N), cy: s(0.42 * N), r: N * 0.07 * motif }
  const hill = [
    [0.3, 0.68],
    [0.44, 0.5],
    [0.54, 0.6],
    [0.62, 0.5],
    [0.7, 0.68],
  ].map(([hx, hy]) => [s(hx * N), s(hy * N)])

  const inRoundRect = (x, y, r) => {
    if (x < px.x0 || x > px.x1 || y < px.y0 || y > px.y1) return false
    const dx = Math.min(x - px.x0, px.x1 - x)
    const dy = Math.min(y - px.y0, px.y1 - y)
    if (dx > r || dy > r) return true
    return Math.hypot(r - dx, r - dy) <= r
  }
  const inOuter = (x, y) => {
    const dx = Math.min(x, N - x)
    const dy = Math.min(y, N - y)
    if (dx > rad || dy > rad) return true
    return Math.hypot(rad - dx, rad - dy) <= rad
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const t = (x + y) / (2 * N)
      let col = [
        Math.round(lerp(C.a[0], C.b[0], t)),
        Math.round(lerp(C.a[1], C.b[1], t)),
        Math.round(lerp(C.a[2], C.b[2], t)),
      ]
      let alpha = 255
      if (inRoundRect(x, y, corner)) {
        col = C.white
        if (pointInPoly(x, y, hill)) col = C.hill
        const ds = Math.hypot(x - sun.cx, y - sun.cy)
        if (ds <= sun.r) col = C.sun
      }
      if (!maskable && !inOuter(x, y)) alpha = 0
      const i = (y * N + x) * 4
      buf[i] = col[0]
      buf[i + 1] = col[1]
      buf[i + 2] = col[2]
      buf[i + 3] = alpha
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
