import JSZip from 'jszip'

// Simplified batch export - caller provides dataUrls
export async function batchExport(
  files: { name: string; dataUrl: string }[],
): Promise<Blob> {
  const zip = new JSZip()
  for (const { name, dataUrl } of files) {
    const base64 = dataUrl.split(',')[1]
    zip.file(name, base64, { base64: true })
  }
  return await zip.generateAsync({ type: 'blob' })
}
