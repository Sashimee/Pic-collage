// GIF export using gif.js (client-side, no server)
import GIF from 'gif.js'

export async function exportGIF(
  frames: ImageBitmap[],
  fps: number = 10,
  quality: number = 10,
): Promise<Blob> {
  const gif = new GIF({
    workers: 2,
    quality,
    width: frames[0].width,
    height: frames[0].height,
    workerScript: '/gif.worker.js',
  })

  for (const frame of frames) {
    const canvas = document.createElement('canvas')
    canvas.width = frame.width
    canvas.height = frame.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(frame, 0, 0)
    gif.addFrame(ctx, { copy: true, delay: 1000 / fps })
  }

  return new Promise((resolve) => {
    gif.on('finished', (blob: Blob) => resolve(blob))
    gif.render()
  })
}

// WebM/MP4 export using MediaRecorder (browser-native)
export async function exportWebM(
  canvas: HTMLCanvasElement,
  fps: number = 30,
  durationSeconds: number = 5,
  frames?: ImageBitmap[],
): Promise<Blob> {
  const stream = canvas.captureStream(fps)
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  return new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))

    if (frames && frames.length > 1) {
      recorder.start()
      const ctx = canvas.getContext('2d')!
      const startTime = performance.now()
      const totalMs = durationSeconds * 1000
      const segmentMs = totalMs / frames.length
      const fadeRatio = 0.4 // 40% of each segment is crossfade

      const animate = (now: number) => {
        const elapsed = now - startTime
        if (elapsed >= totalMs) {
          recorder.stop()
          return
        }

        const idx = Math.floor(elapsed / segmentMs)
        const t = (elapsed % segmentMs) / segmentMs

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Hold phase: draw current frame fully opaque
        const current = frames[Math.min(idx, frames.length - 1)]
        ctx.globalAlpha = 1
        ctx.drawImage(current, 0, 0)

        // Fade phase: crossfade to next frame
        if (idx + 1 < frames.length && t > 1 - fadeRatio) {
          const fade = (t - (1 - fadeRatio)) / fadeRatio // 0..1
          ctx.globalAlpha = Math.min(1, Math.max(0, fade))
          ctx.drawImage(frames[idx + 1], 0, 0)
        }

        ctx.globalAlpha = 1
        requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
    } else {
      recorder.start()
      setTimeout(() => recorder.stop(), durationSeconds * 1000)
    }
  })
}
