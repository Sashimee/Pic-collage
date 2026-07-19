export interface ImportedPhoto {
  src: string
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

export async function loadPhotoMeta(file: File): Promise<ImportedPhoto> {
  // 1) Get the native image dimensions
  const img = new Image()
  const url = URL.createObjectURL(file)
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (e) => reject(new Error('Image load failed from blob URL: ' + String(e)))
      img.src = url
    })
    return { src: url, width: img.naturalWidth, height: img.naturalHeight, blob: file }
  } catch {
    // 2) CSP might block blob: URLs (e.g. on GitHub Pages). Fall back to base64.
    URL.revokeObjectURL(url)
    const base64 = await blobToBase64(file)
    const img2 = new Image()
    await new Promise<void>((resolve, reject) => {
      img2.onload = () => resolve()
      img2.onerror = () => reject(new Error('Image load failed from base64'))
      img2.src = base64
    })
    return { src: base64, width: img2.naturalWidth, height: img2.naturalHeight, blob: file }
  }
}
