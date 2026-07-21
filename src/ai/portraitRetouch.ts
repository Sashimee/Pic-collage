// Portrait retouch using face-api.js face landmarks.
// Applies skin smoothing, teeth whitening, and eye brightening via Canvas pixel manipulation.

import * as faceapi from 'face-api.js'
import { loadFaceModels } from './faceDetection'

export interface RetouchSettings {
  skinSmooth: number // 0..1
  teethWhite: number // 0..1
  eyeBrighten: number // 0..1
}

export const DEFAULT_RETouch_SETTINGS: RetouchSettings = {
  skinSmooth: 0.35,
  teethWhite: 0.4,
  eyeBrighten: 0.35,
}

interface Point { x: number; y: number }

function getPoints(landmarks: faceapi.FaceLandmarks68, indices: number[]): Point[] {
  return indices.map((i) => {
    const p = landmarks.positions[i]
    return { x: p.x, y: p.y }
  })
}

function boundingBox(points: Point[]) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

function expandBox(box: { x: number; y: number; width: number; height: number }, factor: number) {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  return {
    x: cx - (box.width * factor) / 2,
    y: cy - (box.height * factor) / 2,
    width: box.width * factor,
    height: box.height * factor,
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Approximate bilateral filter for skin smoothing. */
function applySkinSmooth(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  faceBox: { x: number; y: number; width: number; height: number },
  strength: number,
) {
  if (strength <= 0) return
  const radius = Math.max(2, Math.round(Math.min(faceBox.width, faceBox.height) * 0.04))
  const sigmaSpatial = radius
  const sigmaColor = 40
  const output = new Uint8ClampedArray(data.length)
  output.set(data)

  const startX = Math.max(0, Math.floor(faceBox.x - faceBox.width * 0.2))
  const startY = Math.max(0, Math.floor(faceBox.y - faceBox.height * 0.2))
  const endX = Math.min(width, Math.ceil(faceBox.x + faceBox.width * 1.2))
  const endY = Math.min(height, Math.ceil(faceBox.y + faceBox.height * 1.2))

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4
      let r = 0, g = 0, b = 0, wSum = 0
      const r0 = data[idx]
      const g0 = data[idx + 1]
      const b0 = data[idx + 2]

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy
          const nx = x + dx
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue
          const nIdx = (ny * width + nx) * 4
          const dr = data[nIdx] - r0
          const dg = data[nIdx + 1] - g0
          const db = data[nIdx + 2] - b0
          const colorDist = Math.sqrt(dr * dr + dg * dg + db * db)
          const spatialDist = Math.sqrt(dx * dx + dy * dy)
          const weight =
            Math.exp(-(spatialDist * spatialDist) / (2 * sigmaSpatial * sigmaSpatial)) *
            Math.exp(-(colorDist * colorDist) / (2 * sigmaColor * sigmaColor))
          r += data[nIdx] * weight
          g += data[nIdx + 1] * weight
          b += data[nIdx + 2] * weight
          wSum += weight
        }
      }

      if (wSum > 0) {
        const nr = r / wSum
        const ng = g / wSum
        const nb = b / wSum
        output[idx] = data[idx] + (nr - data[idx]) * strength
        output[idx + 1] = data[idx + 1] + (ng - data[idx + 1]) * strength
        output[idx + 2] = data[idx + 2] + (nb - data[idx + 2]) * strength
      }
    }
  }

  data.set(output)
}

/** Boost blue channel in mouth region for teeth whitening. */
function applyTeethWhite(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mouthPoints: Point[],
  strength: number,
) {
  if (strength <= 0 || mouthPoints.length === 0) return
  const box = expandBox(boundingBox(mouthPoints), 1.1)
  const startX = Math.max(0, Math.floor(box.x))
  const startY = Math.max(0, Math.floor(box.y))
  const endX = Math.min(width, Math.ceil(box.x + box.width))
  const endY = Math.min(height, Math.ceil(box.y + box.height))

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      // Only target lighter pixels (teeth) inside mouth region
      if (brightness > 120) {
        data[idx + 2] = clamp(data[idx + 2] + 25 * strength, 0, 255)
        data[idx] = clamp(data[idx] + 10 * strength, 0, 255)
        data[idx + 1] = clamp(data[idx + 1] + 15 * strength, 0, 255)
      }
    }
  }
}

/** Boost brightness in eye region. */
function applyEyeBrighten(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  leftEye: Point[],
  rightEye: Point[],
  strength: number,
) {
  if (strength <= 0) return
  const boxes = [leftEye, rightEye].filter((p) => p.length > 0).map((p) => expandBox(boundingBox(p), 1.2))
  for (const box of boxes) {
    const startX = Math.max(0, Math.floor(box.x))
    const startY = Math.max(0, Math.floor(box.y))
    const endX = Math.min(width, Math.ceil(box.x + box.width))
    const endY = Math.min(height, Math.ceil(box.y + box.height))
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        if (brightness > 80) {
          const boost = 30 * strength
          data[idx] = clamp(data[idx] + boost, 0, 255)
          data[idx + 1] = clamp(data[idx + 1] + boost, 0, 255)
          data[idx + 2] = clamp(data[idx + 2] + boost * 0.6, 0, 255)
        }
      }
    }
  }
}

/** Apply portrait retouch to an image and return a data URL. */
export async function portraitRetouch(
  src: string,
  settings: RetouchSettings = DEFAULT_RETouch_SETTINGS,
): Promise<string> {
  await loadFaceModels()

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imgData.data

  const detections = await faceapi
    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()

  for (const d of detections) {
    const lm = d.landmarks
    const faceBox = d.detection.box

    if (settings.skinSmooth > 0) {
      applySkinSmooth(data, canvas.width, canvas.height, faceBox, settings.skinSmooth)
    }

    // Mouth indices (upper/lower lip + corners) in 68-point model: 48-67
    const mouthPoints = getPoints(lm, Array.from({ length: 20 }, (_, i) => i + 48))
    if (settings.teethWhite > 0) {
      applyTeethWhite(data, canvas.width, canvas.height, mouthPoints, settings.teethWhite)
    }

    // Left eye: 36-41, Right eye: 42-47
    const leftEye = getPoints(lm, Array.from({ length: 6 }, (_, i) => i + 36))
    const rightEye = getPoints(lm, Array.from({ length: 6 }, (_, i) => i + 42))
    if (settings.eyeBrighten > 0) {
      applyEyeBrighten(data, canvas.width, canvas.height, leftEye, rightEye, settings.eyeBrighten)
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}
