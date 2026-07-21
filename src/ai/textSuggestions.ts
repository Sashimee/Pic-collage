// AI text suggestions: analyze photo content (faces, colors, count) and return contextual captions.

import { detectFaces } from './faceDetection'

export interface PhotoAnalysis {
  faceCount: number
  dominantMood: 'warm' | 'cool' | 'neutral'
  subjectCount: 'solo' | 'group' | 'none'
}

const SUGGESTIONS = {
  warmSolo: ['Summer vibes ☀️', 'Golden hour ✨', 'Chasing the sun 🌞'],
  warmGroup: ['Family memories ❤️', 'Good times with great people 👯', 'Squad goals 🔥'],
  coolSolo: ['Winter wonder ❄️', 'Chill mode activated 🧊', 'Blue mood 💙'],
  coolGroup: ['Adventure crew 🏔️', 'Nature escape 🌿', 'Explorer gang 🗺️'],
  neutralSolo: ['Self care Sunday 🌸', 'Me time ☕', 'Reflecting… 🌙'],
  neutralGroup: ['Friends forever 🤝', 'Together is better 💫', 'Moments that matter 📸'],
}

/** Analyze a photo and return contextual caption suggestions. */
export async function analyzePhoto(src: string): Promise<PhotoAnalysis> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.min(img.naturalWidth, 640)
  canvas.height = Math.round(canvas.width * (img.naturalHeight / img.naturalWidth))
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imgData.data

  let warmSum = 0
  let coolSum = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    warmSum += r + g * 0.7
    coolSum += b + g * 0.7
  }

  const warmAvg = warmSum / pixelCount
  const coolAvg = coolSum / pixelCount
  const dominantMood: PhotoAnalysis['dominantMood'] =
    warmAvg > coolAvg * 1.15 ? 'warm' : coolAvg > warmAvg * 1.15 ? 'cool' : 'neutral'

  let faceCount = 0
  try {
    const faces = await detectFaces(src)
    faceCount = faces.length
  } catch {
    // face detection may fail — that's fine
  }

  const subjectCount: PhotoAnalysis['subjectCount'] =
    faceCount === 0 ? 'none' : faceCount === 1 ? 'solo' : 'group'

  return { faceCount, dominantMood, subjectCount }
}

/** Return caption suggestions based on photo analysis. */
export function getSuggestions(analysis: PhotoAnalysis): string[] {
  const key = `${analysis.dominantMood}${analysis.subjectCount === 'none' ? 'Solo' : analysis.subjectCount.charAt(0).toUpperCase() + analysis.subjectCount.slice(1)}` as keyof typeof SUGGESTIONS
  const base = SUGGESTIONS[key] ?? SUGGESTIONS.neutralSolo
  // Add fallback contextual extras
  const extras: string[] = []
  if (analysis.faceCount >= 3) extras.push('Besties for life 💕')
  if (analysis.dominantMood === 'warm') extras.push('City lights ✨')
  if (analysis.dominantMood === 'cool') extras.push('Ocean breeze 🌊')
  return [...base, ...extras].slice(0, 5)
}
