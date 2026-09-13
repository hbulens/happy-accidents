// Client-side: shrink an uploaded photo so the request stays small and the
// model gets a sensible resolution. Returns base64 without the data: prefix.

export interface EncodedImage {
  mediaType: 'image/jpeg'
  data: string
  dataUrl: string
  width: number
  height: number
}

export async function encodeImageForUpload(file: File, maxEdge = 1280): Promise<EncodedImage> {
  const bitmap = await loadImage(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86)
  return { mediaType: 'image/jpeg', data: dataUrl.split(',')[1] ?? '', dataUrl, width, height }
}

export async function makeThumbnail(dataUrl: string, maxEdge = 320): Promise<string> {
  const img = await loadImageFromUrl(dataUrl)
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.75)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return loadImageFromUrl(URL.createObjectURL(file))
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = url
  })
}
