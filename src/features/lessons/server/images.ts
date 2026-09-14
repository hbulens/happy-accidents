// Turns a generated lesson into pictures: one finished painting, then one
// "after this step" image per step, edited from the finished painting so the
// composition and colours stay consistent across the sequence.
import type { LessonContent } from '@/features/lessons/schema'
import { fetchAsDataUrl, firstUrl, runModel } from '@/lib/replicate'

const PAINT_MODEL = process.env.HAPPY_ACCIDENTS_PAINT_MODEL ?? 'black-forest-labs/flux-2-pro'
const EDIT_MODEL = process.env.HAPPY_ACCIDENTS_EDIT_MODEL ?? 'black-forest-labs/flux-kontext-pro'
const CONCURRENCY = 4

export const STYLE_PROMPT =
  'A finished wet-on-wet oil painting on canvas in the style of Bob Ross and The Joy of Painting: ' +
  'softly blended sky, palette-knife mountains with broken white highlights, fan-brush evergreen trees, ' +
  'reflections pulled straight down into still water, thick knife impasto and visible bristle texture, ' +
  'gentle warm light, calm and inviting. Only the painting itself fills the frame, no frame, no easel, no people, no text.'

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

/** Edit the finished painting back to the state after a given step. */
export async function paintStep(finalUrl: string, lesson: LessonContent, index: number): Promise<string> {
  const step = lesson.steps[index]
  const isLast = index === lesson.steps.length - 1
  if (isLast) return '' // the finished painting is the last step's image
  const prompt =
    `Show this exact same oil painting at an earlier stage of being painted, after step ${index + 1} of ${lesson.steps.length}. ` +
    `Painted so far: ${step.canvasAfter} ` +
    `Everything that is not yet painted is bare, slightly glossy white primed canvas with a thin coat of Liquid White. ` +
    `Keep the composition, colours, brushwork and the exact placement of everything that already exists identical. ` +
    `Same painting, same view, no frame, no text.`
  const url = firstUrl(
    await runModel(EDIT_MODEL, {
      prompt,
      input_image: finalUrl,
      aspect_ratio: 'match_input_image',
      output_format: 'webp',
      safety_tolerance: 2,
    }),
  )
  return fetchAsDataUrl(url)
}

/** Generate every step image with limited concurrency, reporting as each lands. */
export async function paintSteps(
  finalUrl: string,
  lesson: LessonContent,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
): Promise<void> {
  const indices = lesson.steps.map((_, i) => i).filter((i) => i !== lesson.steps.length - 1)
  let next = 0
  const worker = async () => {
    while (next < indices.length) {
      const i = indices[next++]
      try {
        const dataUrl = await paintStep(finalUrl, lesson, i)
        if (dataUrl) onImage({ kind: 'step', index: i, dataUrl })
      } catch (e) {
        onError({ kind: 'step', index: i, error: e instanceof Error ? e.message : String(e) })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, indices.length) }, worker))
}
