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
    recorder.start()
    setTimeout(() => recorder.stop(), durationSeconds * 1000)
  })
}
