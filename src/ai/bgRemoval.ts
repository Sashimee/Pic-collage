import * as ort from 'onnxruntime-web'

let session: ort.InferenceSession | null = null

const MODEL_URL = '/models/rmbg-2-optimized.onnx'

async function getSession(): Promise<ort.InferenceSession> {
  if (session) return session
  session = await ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  })
  return session
}

/** Resize and normalize image for the model. */
function preprocess(img: HTMLImageElement): {
  tensor: ort.Tensor
  originalWidth: number
  originalHeight: number
  paddedWidth: number
  paddedHeight: number
} {
  const maxSize = 1024
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)

  // Pad to multiple of 32
  const padW = Math.ceil(w / 32) * 32
  const padH = Math.ceil(h / 32) * 32

  const canvas = document.createElement('canvas')
  canvas.width = padW
  canvas.height = padH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  const data = ctx.getImageData(0, 0, padW, padH).data
  const floatData = new Float32Array(padW * padH * 3)

  for (let i = 0; i < padW * padH; i++) {
    floatData[i] = data[i * 4] / 255.0           // R
    floatData[i + padW * padH] = data[i * 4 + 1] / 255.0 // G
    floatData[i + padW * padH * 2] = data[i * 4 + 2] / 255.0 // B
  }

  return {
    tensor: new ort.Tensor('float32', floatData, [1, 3, padH, padW]),
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    paddedWidth: padW,
    paddedHeight: padH,
  }
}

/** Post-process mask to original size with alpha. */
function postprocess(
  maskData: Float32Array,
  paddedW: number,
  paddedH: number,
  origW: number,
  origH: number,
  img: HTMLImageElement,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = origW
  canvas.height = origH
  const ctx = canvas.getContext('2d')!

  // Draw original
  ctx.drawImage(img, 0, 0, origW, origH)
  const imgData = ctx.getImageData(0, 0, origW, origH)

  // Resize mask to original
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = paddedW
  maskCanvas.height = paddedH
  const mctx = maskCanvas.getContext('2d')!
  const mData = mctx.createImageData(paddedW, paddedH)

  for (let i = 0; i < paddedW * paddedH; i++) {
    const v = Math.round(maskData[i] * 255)
    mData.data[i * 4] = v
    mData.data[i * 4 + 1] = v
    mData.data[i * 4 + 2] = v
    mData.data[i * 4 + 3] = 255
  }
  mctx.putImageData(mData, 0, 0)

  // Scale mask canvas down to original
  const maskSmall = document.createElement('canvas')
  maskSmall.width = origW
  maskSmall.height = origH
  const sctx = maskSmall.getContext('2d')!
  sctx.drawImage(maskCanvas, 0, 0, origW, origH)
  const smallMask = sctx.getImageData(0, 0, origW, origH).data

  // Apply mask alpha
  for (let i = 0; i < origW * origH; i++) {
    imgData.data[i * 4 + 3] = smallMask[i * 4]
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Remove background from an image using client-side AI. */
export async function removeBackground(src: string): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const sess = await getSession()
  const { tensor, originalWidth, originalHeight, paddedWidth, paddedHeight } = preprocess(img)

  const results = await sess.run({ input: tensor })
  const output = results.output as ort.Tensor
  const maskData = output.data as Float32Array

  return postprocess(maskData, paddedWidth, paddedHeight, originalWidth, originalHeight, img)
}
