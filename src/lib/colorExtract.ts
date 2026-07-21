// Client-side color palette extraction using K-means clustering.

interface RGB {
  r: number
  g: number
  b: number
}

function rgbDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
    Math.pow(a.g - b.g, 2) +
    Math.pow(a.b - b.b, 2),
  )
}

function hex(c: RGB): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
}

/** Extract dominant colors from an image using simple K-means. */
export async function extractPalette(
  src: string,
  k: number = 5,
): Promise<string[]> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const canvas = document.createElement('canvas')
  const maxSize = 200
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1)
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const pixels: RGB[] = []

  // Sample every 4th pixel for speed
  for (let i = 0; i < data.length; i += 16) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }

  // K-means++ initialization
  const centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]]
  while (centroids.length < k) {
    const distances = pixels.map((p) => {
      const d = Math.min(...centroids.map((c) => rgbDistance(p, c)))
      return d * d
    })
    const total = distances.reduce((a, b) => a + b, 0)
    let threshold = Math.random() * total
    let idx = 0
    while (threshold > 0 && idx < distances.length) {
      threshold -= distances[idx]
      idx++
    }
    centroids.push(pixels[Math.min(idx, pixels.length - 1)])
  }

  // K-means iterations
  for (let iter = 0; iter < 10; iter++) {
    const clusters: RGB[][] = new Array(k).fill(null).map(() => [])

    for (const p of pixels) {
      let best = 0
      let bestD = rgbDistance(p, centroids[0])
      for (let i = 1; i < k; i++) {
        const d = rgbDistance(p, centroids[i])
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      clusters[best].push(p)
    }

    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue
      const sum = clusters[i].reduce(
        (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
        { r: 0, g: 0, b: 0 },
      )
      centroids[i] = {
        r: sum.r / clusters[i].length,
        g: sum.g / clusters[i].length,
        b: sum.b / clusters[i].length,
      }
    }
  }

  return centroids.map(hex)
}

/** Generate a background suggestion from a photo's palette. */
export function suggestBackground(palette: string[]): {
  type: 'solid' | 'gradient'
  color: string
  gradientFrom: string
  gradientTo: string
} {
  if (palette.length < 2) {
    return { type: 'solid', color: palette[0] ?? '#ffffff', gradientFrom: '#6366f1', gradientTo: '#ec4899' }
  }
  return {
    type: 'gradient',
    color: palette[0],
    gradientFrom: palette[0],
    gradientTo: palette[1] || palette[0],
  }
}
