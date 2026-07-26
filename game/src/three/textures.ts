import * as THREE from 'three'
import type { BallSkin } from '../data/roster'

/**
 * Every texture in the game is drawn with the 2D canvas API at startup. That
 * keeps the build to text assets only — nothing to download, nothing to cache,
 * and re-skinning a ball is a few lines of drawing code instead of a PNG.
 *
 * Results are memoised: these run once and are reused by every material.
 */
const cache = new Map<string, THREE.Texture>()

function draw(key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): THREE.Texture {
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')!
  paint(c)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  return tex
}

/** Mown stripes, running across the pitch so they read as distance. */
export function grassTexture(): THREE.Texture {
  const tex = draw('grass', 64, 256, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 === 0 ? '#63c86b' : '#57bb60'
      c.fillRect(0, i * 32, 64, 32)
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 6)
  return tex
}

/** Goal netting: transparent with a soft white mesh. */
export function netTexture(): THREE.Texture {
  const tex = draw('net', 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128)
    c.strokeStyle = 'rgba(255,255,255,0.55)'
    c.lineWidth = 2
    for (let i = 0; i <= 128; i += 16) {
      c.beginPath()
      c.moveTo(i, 0)
      c.lineTo(i, 128)
      c.moveTo(0, i)
      c.lineTo(128, i)
      c.stroke()
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(10, 4)
  return tex
}

export function ballTexture(skin: BallSkin): THREE.Texture {
  return draw(`ball:${skin.id}`, 256, 256, (c) => {
    c.fillStyle = skin.base
    c.fillRect(0, 0, 256, 256)
    c.fillStyle = skin.accent
    c.strokeStyle = skin.accent

    switch (skin.pattern) {
      case 'classic':
        // Rough panel spots — a stylised football, not a real one.
        for (const [x, y] of [
          [40, 60],
          [130, 40],
          [200, 110],
          [80, 160],
          [180, 210],
        ]) {
          polygon(c, x, y, 26, 5)
        }
        break
      case 'hearts':
        scatter(12, (x, y, s) => heart(c, x, y, s))
        break
      case 'stars':
        scatter(14, (x, y, s) => star(c, x, y, s, 5))
        break
      case 'rainbow':
        for (let i = 0; i < 6; i++) {
          c.strokeStyle = ['#ff6b8b', '#ffab5c', '#ffe066', '#7ed67e', '#7bd3ff', '#c07bff'][i]
          c.lineWidth = 14
          c.beginPath()
          c.arc(128, 300, 190 - i * 16, Math.PI * 1.15, Math.PI * 1.85)
          c.stroke()
        }
        break
      case 'unicorn':
        scatter(10, (x, y, s) => star(c, x, y, s, 4))
        c.fillStyle = '#ffd84d'
        star(c, 128, 128, 34, 4)
        break
    }
  })
}

function scatter(count: number, paint: (x: number, y: number, s: number) => void) {
  // A fixed pseudo-random walk: deterministic, so the same skin always looks
  // the same across reloads and across devices.
  let seed = 7
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < count; i++) paint(rand() * 236 + 10, rand() * 236 + 10, 10 + rand() * 10)
}

function polygon(c: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number) {
  c.beginPath()
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, points: number) {
  c.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.45
    const px = x + Math.cos(a) * rad
    const py = y + Math.sin(a) * rad
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
}

function heart(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath()
  c.moveTo(x, y + s * 0.7)
  c.bezierCurveTo(x - s * 1.3, y - s * 0.4, x - s * 0.4, y - s * 1.2, x, y - s * 0.4)
  c.bezierCurveTo(x + s * 0.4, y - s * 1.2, x + s * 1.3, y - s * 0.4, x, y + s * 0.7)
  c.closePath()
  c.fill()
}
