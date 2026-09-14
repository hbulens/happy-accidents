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
  try {
    return await removeSignature(url)
  } catch {
    return { url, dataUrl: await fetchAsDataUrl(url) }
  }
}

/** Kontext removes a fake signature far more reliably than a prompt prevents one. */
export async function removeSignature(finalUrl: string): Promise<{ url: string; dataUrl: string }> {
  const url = firstUrl(
    await runModel(EDIT_MODEL, {
      prompt:
        'Remove any signature, initials, lettering or text from this oil painting, filling the area with the surrounding paint. Change nothing else.',
      input_image: finalUrl,
      aspect_ratio: 'match_input_image',
      output_format: 'jpg',
      safety_tolerance: 2,
    }),
  )
  return { url, dataUrl: await fetchAsDataUrl(url) }
}

/** Steps per anchor hop. Kontext follows short removal lists well and repaints the scene for long ones. */
const BATCH = 3

/** Removal instruction: what to take out, what remains. Negations backfire, so none. */
export function stepPrompt(lesson: LessonContent, index: number, throughIndex: number): string {
  const removed = lesson.steps.slice(index + 1, throughIndex + 1).map((s) => s.paintsIn)
  const remaining = lesson.steps[index]
  return (
    `Remove ${removed.join('; and ')}; and any signature, initials or lettering from this oil painting. ` +
    `Where they were, show only what was painted underneath, and any area that was never painted is smooth white primed canvas. ` +
    `What remains on the canvas: ${remaining.canvasAfter} ` +
    `Keep everything that remains exactly as it is: same composition, same brushwork, same colours.`
  )
}

/**
 * Walk backwards from the finished painting in short hops. Every picture
 * removes at most BATCH steps' additions from the nearest later anchor, and
 * the earliest picture of each hop becomes the next anchor. Short removal
 * lists keep Kontext faithful; few hops keep drift small.
 */
export async function paintSteps(
  finalUrl: string,
  lesson: LessonContent,
  onImage: (e: ImageEvent) => void,
  onError: (e: ImageStatus) => void,
): Promise<void> {
  let anchorIdx = lesson.steps.length - 1
  let anchorUrl = finalUrl
  while (anchorIdx > 0) {
    const nextAnchor = Math.max(0, anchorIdx - BATCH)
    for (let i = anchorIdx - 1; i >= nextAnchor; i--) {
      try {
        const url = firstUrl(
          await runModel(EDIT_MODEL, {
            prompt: stepPrompt(lesson, i, anchorIdx),
            input_image: anchorUrl,
            aspect_ratio: 'match_input_image',
            output_format: 'jpg',
            safety_tolerance: 2,
          }),
        )
        onImage({ kind: 'step', index: i, dataUrl: await fetchAsDataUrl(url) })
        if (i === nextAnchor) anchorUrl = url
      } catch (e) {
        onError({ kind: 'step', index: i, error: e instanceof Error ? e.message : String(e) })
        if (i === nextAnchor) return // no anchor to continue from
      }
    }
    anchorIdx = nextAnchor
  }
}
