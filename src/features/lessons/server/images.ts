// Turns a generated lesson into pictures: one finished painting, then one
// "after this step" image per step, edited from the finished painting so the
// composition and colours stay consistent across the sequence.
import type { LessonContent } from '@/features/lessons/schema'
import { fetchAsDataUrl, firstUrl, runModel } from '@/lib/replicate'

const PAINT_MODEL = process.env.HAPPY_ACCIDENTS_PAINT_MODEL ?? 'black-forest-labs/flux-2-pro'
const EDIT_MODEL = process.env.HAPPY_ACCIDENTS_EDIT_MODEL ?? 'black-forest-labs/flux-kontext-pro'

export const STYLE_PROMPT =
  'A finished wet-on-wet oil painting on canvas in the style of Bob Ross and The Joy of Painting: ' +
  'softly blended sky, palette-knife mountains with broken white highlights, fan-brush evergreen trees, ' +
  'reflections pulled straight down into still water, thick knife impasto and visible bristle texture, ' +
  'gentle warm light, calm and inviting. Only the painting itself fills the frame, no frame, no easel, no people, no text, no signature, unsigned.'

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

/**
 * Paint the finished picture. With a photo, the model uses it as a reference
 * and translates it into the painting described by the lesson.
 */
export async function paintFinal(lesson: LessonContent, photo: Photo | null): Promise<{ url: string; dataUrl: string }> {
  const prompt = photo
    ? `${STYLE_PROMPT} Repaint the reference photo as this painting, simplified into big soft shapes: ${lesson.paintingPrompt}`
    : `${STYLE_PROMPT} The scene: ${lesson.paintingPrompt}`
  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: '4:3',
    resolution: '1 MP',
    output_format: 'webp',
    output_quality: 85,
    safety_tolerance: 2,
  }
  if (photo) input.input_images = [`data:${photo.mediaType};base64,${photo.data}`]
  const url = firstUrl(await runModel(PAINT_MODEL, input))
  return { url, dataUrl: await fetchAsDataUrl(url) }
}

/**
 * Walk backwards from the finished painting: each step picture is the next
 * step's picture with that step's additions removed. Edit models are far more
 * reliable at "remove X" than at "show an earlier stage", and chaining keeps
 * every picture consistent with the one after it. Pictures therefore arrive
 * last step first.
 */
export async function paintSteps(
  finalUrl: string,
  lesson: LessonContent,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
): Promise<void> {
  let currentUrl = finalUrl
  for (let i = lesson.steps.length - 2; i >= 0; i--) {
    const removed = lesson.steps[i + 1]
    const remaining = lesson.steps[i]
    const prompt =
      `Remove ${removed.paintsIn} from this oil painting. ` +
      `Where it was, show only what was painted underneath. After the change the painting shows exactly this and nothing more: ${remaining.canvasAfter} ` +
      `Any area described as bare or unpainted is smooth white primed canvas with a thin coat of Liquid White. ` +
      `Keep everything that remains exactly as it is: same composition, same brushwork, same colours. No signature, no text.`
    try {
      const url = firstUrl(
        await runModel(EDIT_MODEL, {
          prompt,
          input_image: currentUrl,
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
          safety_tolerance: 2,
        }),
      )
      currentUrl = url
      onImage({ kind: 'step', index: i, dataUrl: await fetchAsDataUrl(url) })
    } catch (e) {
      onError({ kind: 'step', index: i, error: e instanceof Error ? e.message : String(e) })
      return // the chain cannot continue without this picture
    }
  }
}
