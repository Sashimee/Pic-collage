// Face detection using face-api.js (client-side, no server)
// Model files are loaded from CDN / public folder.

import * as faceapi from 'face-api.js'

const MODEL_URL = '/models/face-api'

let modelsLoaded = false

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

export interface DetectedFace {
  x: number
  y: number
  width: number
  height: number
  landmarks: faceapi.FaceLandmarks68 | undefined
}

/** Detect faces in an image. Returns bounding boxes for smart crop suggestions. */
export async function detectFaces(src: string): Promise<DetectedFace[]> {
  await loadFaceModels()

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const detections = await faceapi
    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()

  return detections.map((d) => ({
    x: d.detection.box.x,
    y: d.detection.box.y,
    width: d.detection.box.width,
    height: d.detection.box.height,
    landmarks: d.landmarks,
  }))
}

/** Compute a smart crop rectangle that centers on detected faces. */
export function computeSmartCrop(
  faces: DetectedFace[],
  imageW: number,
  imageH: number,
  targetAspect: number,
): { x: number; y: number; width: number; height: number } {
  if (faces.length === 0) {
    // No faces — crop from center
    const currentAspect = imageW / imageH
    if (currentAspect > targetAspect) {
      const w = imageH * targetAspect
      return { x: (imageW - w) / 2, y: 0, width: w, height: imageH }
    } else {
      const h = imageW / targetAspect
      return { x: 0, y: (imageH - h) / 2, width: imageW, height: h }
    }
  }

  // Compute bounding box of all faces
  const minX = Math.min(...faces.map((f) => f.x))
  const minY = Math.min(...faces.map((f) => f.y))
  const maxX = Math.max(...faces.map((f) => f.x + f.width))
  const maxY = Math.max(...faces.map((f) => f.y + f.height))

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  // Determine crop dimensions from target aspect
  let cropW: number, cropH: number
  if (imageW / imageH > targetAspect) {
    cropH = imageH
    cropW = cropH * targetAspect
  } else {
    cropW = imageW
    cropH = cropW / targetAspect
  }

  // Center crop on face cluster
  let x = centerX - cropW / 2
  let y = centerY - cropH / 2

  // Clamp to image bounds
  x = Math.max(0, Math.min(x, imageW - cropW))
  y = Math.max(0, Math.min(y, imageH - cropH))

  return { x, y, width: cropW, height: cropH }
}
