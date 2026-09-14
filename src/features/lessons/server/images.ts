// Lesson pictures with no reimagining: the finished painting is made once,
// then revealed step by step. Each step's picture shows the finished painting
// only inside the regions painted so far and bare primed canvas elsewhere, so
// every picture is exactly the previous one plus new paint.
import type { LessonContent } from '@/features/lessons/schema'
import { fetchAsDataUrl, firstUrl, runModel } from '@/lib/replicate'
import {
  composite,
  createCanvas,
  decodeJpeg,
  dilateMask,
  drawGrid,
  encodeJpeg,
  feather,
  labelAbove,
  labelEquals,
  labelMap,
  maskArea,
  maskMinus,
  maskToJpeg,
  polygonMask,
  resize,
  toDataUrl,
  type Raster,
} from '@/lib/raster'
import { mapRegions, type Regions } from '@/features/lessons/server/regions'

const PAINT_MODEL = process.env.HAPPY_ACCIDENTS_PAINT_MODEL ?? 'black-forest-labs/flux-2-pro'
const EDIT_MODEL = process.env.HAPPY_ACCIDENTS_EDIT_MODEL ?? 'black-forest-labs/flux-kontext-pro'
const FILL_MODEL = process.env.HAPPY_ACCIDENTS_FILL_MODEL ?? 'black-forest-labs/flux-fill-pro'
/** Hidden areas smaller than this share of the canvas are not worth an inpaint call. */
const MIN_HIDDEN_AREA = 0.004
export const CANVAS_W = 1024
export const CANVAS_H = 768
const CANVAS_COLOR = '#f4efe3'

export const STYLE_PROMPT =
  'A finished wet-on-wet oil painting on canvas in the style of Bob Ross and The Joy of Painting: ' +
  'softly blended sky, palette-knife mountains with broken white highlights, fan-brush evergreen trees, ' +
  'reflections pulled straight down into still water, thick knife impasto and visible bristle texture, ' +
  'gentle warm light, calm and inviting. Only the painting itself fills the frame, unsigned, with the whole canvas painted edge to edge.'

export interface ImageEvent {
  kind: 'final' | 'step'
  index: number
  dataUrl: string
}

export interface ImageStatus {
  kind: 'final' | 'step'
  index: number
  error: string
}

interface Photo {
  mediaType: string
  data: string
}

/** Paint the finished picture (with the photo as reference in photo mode) and strip any signature. */
export async function paintFinal(lesson: LessonContent, photo: Photo | null): Promise<Raster> {
  const prompt = photo
    ? `${STYLE_PROMPT} Repaint the reference photo as this painting, simplified into big soft shapes: ${lesson.paintingPrompt}`
    : `${STYLE_PROMPT} The scene: ${lesson.paintingPrompt}`
  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: '4:3',
    resolution: '1 MP',
    output_format: 'jpg',
    output_quality: 92,
    safety_tolerance: 2,
  }
  if (photo) input.input_images = [`data:${photo.mediaType};base64,${photo.data}`]
  let url = firstUrl(await runModel(PAINT_MODEL, input))
  try {
    url = firstUrl(
      await runModel(EDIT_MODEL, {
        prompt: 'Remove any signature, initials, lettering or text from this oil painting, filling the area with the surrounding paint. Change nothing else.',
        input_image: url,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        safety_tolerance: 2,
      }),
    )
  } catch {
    /* keep the signed version rather than fail */
  }
  return resize(decodeJpeg(dataUrlBytes(await fetchAsDataUrl(url))), CANVAS_W, CANVAS_H)
}

function dataUrlBytes(dataUrl: string): Uint8Array {
  return new Uint8Array(Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'))
}

/** Ask Claude to outline what each step paints on the finished picture. */
export async function regionsFor(lesson: LessonContent, final: Raster): Promise<Regions> {
  const grid = encodeJpeg(drawGrid(final), 88)
  return mapRegions(lesson, Buffer.from(grid).toString('base64'))
}

/**
 * Paint what lies underneath later layers. For step j, the hidden area is
 * its full extent minus what is visible of it and of earlier steps; Fill Pro
 * continues that step's paint across it. Returns the inpainted picture, or
 * null when nothing meaningful is hidden.
 */
export async function paintUnderlayer(final: Raster, hidden: Float32Array): Promise<Raster | null> {
  const w = final.width
  const h = final.height
  if (maskArea(hidden) < MIN_HIDDEN_AREA) return null
  const grown = dilateMask(hidden, w, h, 6)
  const url = firstUrl(
    await runModel(FILL_MODEL, {
      image: toDataUrl(encodeJpeg(final, 92)),
      mask: toDataUrl(maskToJpeg(grown, w, h)),
      prompt: 'Continue the surrounding paint across the masked area in the same wet-on-wet oil style, matching its colours, brushwork and lighting, as it looked before anything was painted on top of it.',
      steps: 40,
      guidance: 30,
      output_format: 'jpg',
      safety_tolerance: 2,
      prompt_upsampling: false,
    }),
  )
  return resize(decodeJpeg(dataUrlBytes(await fetchAsDataUrl(url))), w, h)
}

/**
 * Build the pictures up like a real painting. Each step first lays down its
 * hidden underlayer (the inpainted paint later steps will cover), then its
 * visible paint straight from the finished picture. Nothing already on the
 * canvas is ever changed, only covered. Emits a picture per step as it lands.
 */
export async function buildSteps(
  lesson: LessonContent,
  final: Raster,
  regions: Regions,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
  onStatus: (message: string) => void,
): Promise<void> {
  const w = CANVAS_W
  const h = CANVAS_H
  const n = lesson.steps.length
  const visible = Array.from({ length: n }, (_, i) => regions.steps[i]?.visible.map((p) => p.points) ?? [])
  const extent = Array.from({ length: n }, (_, i) => regions.steps[i]?.extent.map((p) => p.points) ?? [])
  const lastPainted = Math.max(0, ...visible.map((p, i) => (p.length ? i : 0)))
  const labels = labelMap(visible, w, h, lastPainted)

  let canvas = createCanvas(w, h, CANVAS_COLOR)
  for (let i = 0; i < n; i++) {
    if (i >= lastPainted) {
      canvas = final
    } else if (visible[i].length) {
      // 1. the paint later steps will cover: this step's extent where the
      //    finished picture shows a later step, inpainted from the picture
      const toFill = maskMinus(polygonMask(extent[i], w, h, 0), maskMinus(polygonMask(extent[i], w, h, 0), labelAbove(labels, i)))
      if (maskArea(toFill) >= MIN_HIDDEN_AREA) {
        onStatus(`Painting underneath step ${i + 1}`)
        try {
          const painted = await paintUnderlayer(final, toFill)
          if (painted) canvas = composite(canvas, painted, feather(toFill, w, h, 2))
        } catch (e) {
          onError({ kind: 'step', index: i, error: e instanceof Error ? e.message : String(e) })
        }
      }
      // 2. this step's visible paint, exactly as in the finished picture
      canvas = composite(canvas, final, feather(labelEquals(labels, i), w, h, 2))
    }
    onImage({ kind: 'step', index: i, dataUrl: toDataUrl(encodeJpeg(canvas, 88)) })
  }
  onImage({ kind: 'final', index: n - 1, dataUrl: toDataUrl(encodeJpeg(final, 90)) })
}

/** The whole picture pipeline for one lesson. */
export async function paintLesson(
  lesson: LessonContent,
  photo: Photo | null,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
  onStatus: (message: string) => void,
): Promise<void> {
  onStatus('Painting the finished picture')
  let final: Raster
  try {
    final = await paintFinal(lesson, photo)
  } catch (e) {
    onError({ kind: 'final', index: -1, error: e instanceof Error ? e.message : String(e) })
    return
  }
  onImage({ kind: 'final', index: lesson.steps.length - 1, dataUrl: toDataUrl(encodeJpeg(final, 90)) })

  onStatus('Mapping each step onto the picture')
  let regions: Regions
  try {
    regions = await regionsFor(lesson, final)
  } catch (e) {
    onError({ kind: 'step', index: -1, error: e instanceof Error ? e.message : String(e) })
    return
  }
  await buildSteps(lesson, final, regions, onImage, onError, onStatus)
}
