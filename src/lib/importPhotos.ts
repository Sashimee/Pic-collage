export interface ImportedPhoto {
  src: string
  width: number
  height: number
  blob: Blob // the source file, for IndexedDB persistence
}

// Turn a picked File into an object URL plus its intrinsic pixel size.
export function loadPhotoMeta(file: File): Promise<ImportedPhoto> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () =>
      resolve({ src, width: img.naturalWidth, height: img.naturalHeight, blob: file })
    img.onerror = () => {
      URL.revokeObjectURL(src)
      reject(new Error('Could not decode image'))
    }
    img.src = src
  })
}
