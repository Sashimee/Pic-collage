import { putPhoto } from './persistence'

export interface ImportedPhoto {
  src: string // preview variant (1080px) used for display
  originalSrc: string
  previewSrc: string
  thumbSrc: string
  photoId: string
  width: number
  height: number
  blob: Blob
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

function canvasBlob(
  img: HTMLImageElement,
  maxDim: number,
  type = 'image/jpeg',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ratio = img.naturalWidth / img.naturalHeight
    let w = maxDim
    let h = maxDim / ratio
    if (h > maxDim) {
      h = maxDim
      w = maxDim * ratio
    }
    canvas.width = Math.round(w)
    canvas.height = Math.round(h)
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('canvas 2d context failed'))
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      },
      type,
      quality,
    )
  })
}

async function createImageFromSrc(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = (e) => reject(new Error('Image load failed: ' + String(e)))
    img.src = src
  })
  return img
}

export async function loadPhotoMeta(file: File): Promise<ImportedPhoto> {
  const url = URL.createObjectURL(file)
  let img: HTMLImageElement
  try {
    img = await createImageFromSrc(url)
  } catch {
    URL.revokeObjectURL(url)
    const base64 = await blobToBase64(file)
    img = await createImageFromSrc(base64)
  }

  const naturalW = img.naturalWidth
  const naturalH = img.naturalHeight

  // Generate scaled variants using canvas
  const [originalBlob, previewBlob, thumbBlob] = await Promise.all([
    Promise.resolve(file), // keep original file blob
    naturalW > 1080 || naturalH > 1080
      ? canvasBlob(img, 1080, file.type || 'image/jpeg', 0.92)
      : Promise.resolve(file),
    canvasBlob(img, 256, file.type || 'image/jpeg', 0.85),
  ])

  const photoId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const originalSrc = URL.createObjectURL(originalBlob)
  const previewSrc = URL.createObjectURL(previewBlob)
  const thumbSrc = URL.createObjectURL(thumbBlob)

  // Persist all 3 blobs to IndexedDB keyed by photoId + suffix
  await Promise.all([
    putPhoto(`${photoId}:orig`, originalBlob),
    putPhoto(`${photoId}:prev`, previewBlob),
    putPhoto(`${photoId}:thumb`, thumbBlob),
  ])

  // Clean up the temporary object URL used for decoding
  URL.revokeObjectURL(url)

  return {
    photoId,
    src: previewSrc,
    originalSrc,
    previewSrc,
    thumbSrc,
    width: naturalW,
    height: naturalH,
    blob: file,
  }
}
