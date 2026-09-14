// Pure-JS raster helpers for compositing lesson pictures layer upon layer.
// No native image libraries: they are fragile under bun and on serverless.
import jpeg from 'jpeg-js'

export interface Raster {
  width: number
  height: number
  /** RGBA, row-major. */
  data: Uint8Array
}

export interface Pt {
  x: number
  y: number
}

export function decodeJpeg(buf: Uint8Array): Raster {
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 512 })
  return { width: img.width, height: img.height, data: img.data as Uint8Array }
}

export function encodeJpeg(img: Raster, quality = 90): Uint8Array {
  return jpeg.encode({ width: img.width, height: img.height, data: img.data as any }, quality).data
}

export function createCanvas(width: number, height: number, hex: string): Raster {
  const [r, g, b] = hexToRgb(hex)
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
  return { width, height, data }
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Bilinear resize to the given size. Returns the input when sizes already match. */
export function resize(img: Raster, width: number, height: number): Raster {
  if (img.width === width && img.height === height) return img
  const out = new Uint8Array(width * height * 4)
  const sx = img.width / width
  const sy = img.height / height
  for (let y = 0; y < height; y++) {
    const fy = Math.min(img.height - 1, (y + 0.5) * sy - 0.5)
    const y0 = Math.max(0, Math.floor(fy))
    const y1 = Math.min(img.height - 1, y0 + 1)
    const wy = fy - y0
    for (let x = 0; x < width; x++) {
      const fx = Math.min(img.width - 1, (x + 0.5) * sx - 0.5)
      const x0 = Math.max(0, Math.floor(fx))
      const x1 = Math.min(img.width - 1, x0 + 1)
      const wx = fx - x0
      const o = (y * width + x) * 4
      for (let c = 0; c < 4; c++) {
        const p00 = img.data[(y0 * img.width + x0) * 4 + c]
        const p10 = img.data[(y0 * img.width + x1) * 4 + c]
        const p01 = img.data[(y1 * img.width + x0) * 4 + c]
        const p11 = img.data[(y1 * img.width + x1) * 4 + c]
        out[o + c] = Math.round((p00 * (1 - wx) + p10 * wx) * (1 - wy) + (p01 * (1 - wx) + p11 * wx) * wy)
      }
    }
  }
  return { width, height, data: out }
}

/**
 * Rasterise polygons (in 0..100 x 0..75 lesson space) into a soft mask,
 * 0..1 per pixel, feathered by a box blur of `feather` pixels.
 */
export function polygonMask(polygons: Pt[][], width: number, height: number, feather = 8): Float32Array {
  const mask = new Float32Array(width * height)
  for (const poly of polygons) {
    if (poly.length < 3) continue
    const pts = poly.map((p) => ({ x: (p.x / 100) * width, y: (p.y / 75) * height }))
    for (let y = 0; y < height; y++) {
      const cy = y + 0.5
      const xs: number[] = []
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i]
        const b = pts[j]
        if (a.y > cy !== b.y > cy) xs.push(a.x + ((cy - a.y) * (b.x - a.x)) / (b.y - a.y))
      }
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const x0 = Math.max(0, Math.round(xs[k]))
        const x1 = Math.min(width, Math.round(xs[k + 1]))
        for (let x = x0; x < x1; x++) mask[y * width + x] = 1
      }
    }
  }
  return feather > 0 ? boxBlur(mask, width, height, feather) : mask
}

function boxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const win = radius * 2 + 1
  for (let y = 0; y < height; y++) {
    let acc = 0
    for (let x = -radius; x <= radius; x++) acc += src[y * width + clampi(x, 0, width - 1)]
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = acc / win
      acc += src[y * width + clampi(x + radius + 1, 0, width - 1)] - src[y * width + clampi(x - radius, 0, width - 1)]
    }
  }
  for (let x = 0; x < width; x++) {
    let acc = 0
    for (let y = -radius; y <= radius; y++) acc += tmp[clampi(y, 0, height - 1) * width + x]
    for (let y = 0; y < height; y++) {
      out[y * width + x] = acc / win
      acc += tmp[clampi(y + radius + 1, 0, height - 1) * width + x] - tmp[clampi(y - radius, 0, height - 1) * width + x]
    }
  }
  return out
}

function clampi(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** base where mask is 0, top where mask is 1. Returns a new raster. */
export function composite(base: Raster, top: Raster, mask: Float32Array): Raster {
  const out = new Uint8Array(base.data.length)
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const m = mask[p]
    if (m <= 0) {
      out[i] = base.data[i]
      out[i + 1] = base.data[i + 1]
      out[i + 2] = base.data[i + 2]
    } else if (m >= 1) {
      out[i] = top.data[i]
      out[i + 1] = top.data[i + 1]
      out[i + 2] = top.data[i + 2]
    } else {
      out[i] = Math.round(base.data[i] * (1 - m) + top.data[i] * m)
      out[i + 1] = Math.round(base.data[i + 1] * (1 - m) + top.data[i + 1] * m)
      out[i + 2] = Math.round(base.data[i + 2] * (1 - m) + top.data[i + 2] * m)
    }
    out[i + 3] = 255
  }
  return { width: base.width, height: base.height, data: out }
}

export function toDataUrl(jpg: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(jpg).toString('base64')}`
}

/**
 * Alpha from how much each pixel changed between `before` and `after`:
 * 0 below `lo` (untouched), 1 above `hi` (new paint), smooth in between.
 * Multiplied by `limit` (a polygon mask) so re-rendering elsewhere is ignored.
 */
export function diffMask(before: Raster, after: Raster, limit: Float32Array | null, lo = 22, hi = 70, soften = 2): Float32Array {
  const n = before.width * before.height
  const out = new Float32Array(n)
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const dr = before.data[i] - after.data[i]
    const dg = before.data[i + 1] - after.data[i + 1]
    const db = before.data[i + 2] - after.data[i + 2]
    const d = Math.sqrt(dr * dr + dg * dg + db * db)
    let a = d <= lo ? 0 : d >= hi ? 1 : (d - lo) / (hi - lo)
    if (limit) a *= limit[p]
    out[p] = a
  }
  return soften > 0 ? blurMask(out, before.width, before.height, soften) : out
}

export function blurMask(mask: Float32Array, width: number, height: number, radius: number): Float32Array {
  return boxBlur(mask, width, height, radius)
}

/**
 * Remove thin speckle from a difference mask (JPEG noise, hairline edge
 * changes) while keeping solid regions: blur, re-threshold, soften.
 */
export function cleanMask(mask: Float32Array, width: number, height: number): Float32Array {
  const blurred = boxBlur(mask, width, height, 3)
  const out = new Float32Array(mask.length)
  for (let i = 0; i < out.length; i++) {
    const v = (blurred[i] - 0.3) / 0.5
    out[i] = v <= 0 ? 0 : v >= 1 ? 1 : v
  }
  return boxBlur(out, width, height, 2)
}

// 3x5 bitmap digits for grid labels.
const DIGITS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
}

function drawText(img: Raster, text: string, x: number, y: number, scale: number) {
  let cx = x
  for (const ch of text) {
    const rows = DIGITS[ch]
    if (!rows) continue
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 3; c++) {
        if (rows[r][c] !== '1') continue
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const px = cx + c * scale + dx
            const py = y + r * scale + dy
            if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue
            const i = (py * img.width + px) * 4
            img.data[i] = 255
            img.data[i + 1] = 255
            img.data[i + 2] = 0
          }
      }
    cx += 4 * scale
  }
}

/**
 * Draw a labelled coordinate grid (lesson units, 0..100 x 0..75) over a copy
 * of the image so a vision model can read positions off it.
 */
export function drawGrid(img: Raster, spacing = 10): Raster {
  const out: Raster = { width: img.width, height: img.height, data: new Uint8Array(img.data) }
  const line = (x0: number, y0: number, x1: number, y1: number, strong: boolean) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps)
      const y = Math.round(y0 + ((y1 - y0) * s) / steps)
      for (let t = 0; t < (strong ? 3 : 1); t++) {
        const xx = x + (x1 === x0 ? t : 0)
        const yy = y + (y1 === y0 ? t : 0)
        if (xx < 0 || yy < 0 || xx >= out.width || yy >= out.height) continue
        const i = (yy * out.width + xx) * 4
        out.data[i] = strong ? 255 : 40
        out.data[i + 1] = strong ? 40 : 40
        out.data[i + 2] = strong ? 40 : 40
      }
    }
  }
  const scale = Math.max(2, Math.round(img.width / 340))
  for (let gx = 0; gx <= 100; gx += spacing) {
    const px = Math.round((gx / 100) * (img.width - 1))
    line(px, 0, px, img.height - 1, gx % 50 === 0)
    for (const gy of [5, 35, 65]) drawText(out, String(gx), Math.min(px + 3, img.width - 14 * scale), Math.round((gy / 75) * img.height), scale)
  }
  for (let gy = 0; gy <= 75; gy += spacing) {
    const py = Math.round((gy / 75) * (img.height - 1))
    line(0, py, img.width - 1, py, gy % 50 === 0)
    for (const gx of [2, 52]) drawText(out, String(gy), Math.round((gx / 100) * img.width), Math.min(py + 3, img.height - 6 * scale), scale)
  }
  return out
}

/** Element-wise maximum of two masks. */
export function unionMask(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] > b[i] ? a[i] : b[i]
  return out
}

/**
 * Assign every pixel to exactly one region index. Regions are applied in
 * order, later ones overwriting earlier ones where they overlap. Pixels no
 * region covers are grown into from their nearest labelled neighbour, and
 * anything still unlabelled after `maxGrow` rounds gets `fallback`.
 */
export function labelMap(regions: Pt[][][], width: number, height: number, fallback: number, maxGrow = 120): Int16Array {
  const labels = new Int16Array(width * height).fill(-1)
  regions.forEach((polys, index) => {
    if (!polys.length) return
    const m = polygonMask(polys, width, height, 0)
    for (let p = 0; p < m.length; p++) if (m[p] > 0.5) labels[p] = index
  })
  let frontier: number[] = []
  for (let p = 0; p < labels.length; p++) if (labels[p] === -1) frontier.push(p)
  for (let round = 0; round < maxGrow && frontier.length; round++) {
    const next: number[] = []
    const snapshot = Int16Array.from(labels)
    for (const p of frontier) {
      const x = p % width
      const y = (p - x) / width
      let best = -1
      if (x > 0 && snapshot[p - 1] >= 0) best = snapshot[p - 1]
      else if (x < width - 1 && snapshot[p + 1] >= 0) best = snapshot[p + 1]
      else if (y > 0 && snapshot[p - width] >= 0) best = snapshot[p - width]
      else if (y < height - 1 && snapshot[p + width] >= 0) best = snapshot[p + width]
      if (best >= 0) labels[p] = best
      else next.push(p)
    }
    frontier = next
  }
  for (const p of frontier) labels[p] = fallback
  return labels
}

/** Soft mask of pixels whose label is at most `through`, feathered by a small blur. */
export function labelsThrough(labels: Int16Array, width: number, height: number, through: number, feather = 2): Float32Array {
  const m = new Float32Array(labels.length)
  for (let p = 0; p < labels.length; p++) m[p] = labels[p] <= through ? 1 : 0
  return feather > 0 ? boxBlur(m, width, height, feather) : m
}

/** Encode a 0..1 mask as a black-and-white JPEG (white = 1). */
export function maskToJpeg(mask: Float32Array, width: number, height: number, threshold = 0.5): Uint8Array {
  const data = new Uint8Array(width * height * 4)
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const v = mask[p] >= threshold ? 255 : 0
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = 255
  }
  return encodeJpeg({ width, height, data }, 95)
}

/** Grow a binary mask by `radius` pixels (square dilation). */
export function dilateMask(mask: Float32Array, width: number, height: number, radius: number): Float32Array {
  const b = boxBlur(mask, width, height, radius)
  const out = new Float32Array(mask.length)
  for (let i = 0; i < out.length; i++) out[i] = b[i] > 0.0005 ? 1 : 0
  return out
}

/** a AND NOT b, for binary masks. */
export function maskMinus(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] > 0.5 && b[i] <= 0.5 ? 1 : 0
  return out
}

export function maskArea(mask: Float32Array): number {
  let n = 0
  for (let i = 0; i < mask.length; i++) if (mask[i] > 0.5) n++
  return n / mask.length
}

/** Binary mask of pixels with a given label. */
export function labelEquals(labels: Int16Array, value: number): Float32Array {
  const m = new Float32Array(labels.length)
  for (let p = 0; p < labels.length; p++) m[p] = labels[p] === value ? 1 : 0
  return m
}

/** Binary mask of pixels whose label is greater than `value`. */
export function labelAbove(labels: Int16Array, value: number): Float32Array {
  const m = new Float32Array(labels.length)
  for (let p = 0; p < labels.length; p++) m[p] = labels[p] > value ? 1 : 0
  return m
}

/** Feather a binary mask by a small blur. */
export function feather(mask: Float32Array, width: number, height: number, radius = 2): Float32Array {
  return radius > 0 ? boxBlur(mask, width, height, radius) : mask
}
