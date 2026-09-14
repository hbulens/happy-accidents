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
  drawGrid,
  encodeJpeg,
  polygonMask,
  resize,
  toDataUrl,
  unionMask,
  type Raster,
} from '@/lib/raster'
import { mapRegions, type Regions } from '@/features/lessons/server/regions'

const PAINT_MODEL = process.env.HAPPY_ACCIDENTS_PAINT_MODEL ?? 'black-forest-labs/flux-2-pro'
const EDIT_MODEL = process.env.HAPPY_ACCIDENTS_EDIT_MODEL ?? 'black-forest-labs/flux-kontext-pro'
export const CANVAS_W = 1024
export const CANVAS_H = 768
const CANVAS_COLOR = '#f4efe3'
const FEATHER = 5

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
 * Reveal the finished painting step by step. Pure compositing, no model
 * calls: pictures follow within seconds of the final.
 */
export function revealSteps(lesson: LessonContent, final: Raster, regions: Regions, onImage: (e: ImageEvent) => void): void {
  const blank = createCanvas(CANVAS_W, CANVAS_H, CANVAS_COLOR)
  let shown: Float32Array = new Float32Array(CANVAS_W * CANVAS_H)
  const n = lesson.steps.length
  for (let i = 0; i < n; i++) {
    const polys = regions.steps[i]?.polygons.map((p) => p.points) ?? []
    if (polys.length) shown = unionMask(shown, polygonMask(polys, CANVAS_W, CANVAS_H, FEATHER))
    const picture = i === n - 1 ? final : composite(blank, final, shown)
    onImage({ kind: 'step', index: i, dataUrl: toDataUrl(encodeJpeg(picture, 88)) })
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
  onStatus('Revealing the canvas step by step')
  revealSteps(lesson, final, regions, onImage)
}
