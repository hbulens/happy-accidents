// Builds the lesson's pictures layer upon layer. Starting from a blank primed
// canvas, each step asks the edit model to add only that step's paint; the
// result is composited back using a mask of the pixels that actually changed,
// so everything already on the canvas stays pixel-identical. The finished
// painting is simply the canvas after the last step.
import type { LessonContent } from '@/features/lessons/schema'
import { fetchAsDataUrl, firstUrl, runModel } from '@/lib/replicate'
import {
  cleanMask,
  composite,
  createCanvas,
  decodeJpeg,
  diffMask,
  encodeJpeg,
  resize,
  toDataUrl,
  type Raster,
} from '@/lib/raster'

const EDIT_MODEL = process.env.HAPPY_ACCIDENTS_EDIT_MODEL ?? 'black-forest-labs/flux-kontext-pro'
export const CANVAS_W = 1024
export const CANVAS_H = 768
const CANVAS_COLOR = '#f4efe3'

export const STYLE_NOTE =
  'painted wet-on-wet in oils in the style of a public-television landscape painting show: soft blended skies, palette-knife mountains with broken highlights, fan-brush evergreens, thick impasto and visible bristle texture'

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

/** The instruction for one layer. Positive phrasing only: negations backfire. */
export function layerPrompt(lesson: LessonContent, index: number): string {
  const step = lesson.steps[index]
  return (
    `Add ${step.paintsIn}, ${STYLE_NOTE}. ` +
    `Paint it directly onto this canvas as the next layer of the painting in progress. ` +
    `Keep everything already on the canvas exactly as it is, including any bare white areas that this layer does not cover.`
  )
}

export function blankCanvas(): Raster {
  return createCanvas(CANVAS_W, CANVAS_H, CANVAS_COLOR)
}

/** Ask the edit model to add one layer and return the changed pixels composited onto the canvas. */
export async function addLayer(canvas: Raster, prompt: string): Promise<Raster> {
  const url = firstUrl(
    await runModel(EDIT_MODEL, {
      prompt,
      input_image: toDataUrl(encodeJpeg(canvas, 90)),
      aspect_ratio: 'match_input_image',
      output_format: 'jpg',
      safety_tolerance: 2,
    }),
  )
  const edit = resize(decodeJpeg(dataUrlBytes(await fetchAsDataUrl(url))), canvas.width, canvas.height)
  const alpha = cleanMask(diffMask(canvas, edit, null, 22, 70, 0), canvas.width, canvas.height)
  return composite(canvas, edit, alpha)
}

function dataUrlBytes(dataUrl: string): Uint8Array {
  return new Uint8Array(Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'))
}

/**
 * Paint every step in order. The prep step is the blank canvas. Emits a
 * picture per step as it lands and the finished painting at the end. If a
 * layer fails, that step reuses the previous picture and the build goes on.
 */
export async function paintLayers(
  lesson: LessonContent,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
): Promise<void> {
  let canvas = blankCanvas()
  const n = lesson.steps.length
  for (let i = 0; i < n; i++) {
    const step = lesson.steps[i]
    if (step.phase !== 'prep') {
      try {
        canvas = await addLayer(canvas, layerPrompt(lesson, i))
      } catch (e) {
        onError({ kind: 'step', index: i, error: e instanceof Error ? e.message : String(e) })
      }
    }
    onImage({ kind: 'step', index: i, dataUrl: toDataUrl(encodeJpeg(canvas, 88)) })
  }
  onImage({ kind: 'final', index: n - 1, dataUrl: toDataUrl(encodeJpeg(canvas, 90)) })
}
