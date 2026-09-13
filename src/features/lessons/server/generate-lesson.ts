import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { ParsedMessage } from '@anthropic-ai/sdk/lib/parser'
import { anthropic } from '@/lib/anthropic'
import {
  LessonSchema,
  type GenerateRequest,
  type LessonContent,
} from '@/features/lessons/schema'
import { LESSON_SYSTEM_PROMPT, PHOTO_ADDENDUM } from '@/features/lessons/prompts'

const MODEL = 'claude-opus-5'

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

function effort(): Effort {
  const v = process.env.HAPPY_ACCIDENTS_EFFORT
  if (v === 'low' || v === 'medium' || v === 'high' || v === 'xhigh' || v === 'max') return v
  return 'high'
}

export class LessonGenerationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export async function generateLesson(req: GenerateRequest): Promise<LessonContent> {
  const content: Anthropic.ContentBlockParam[] = []
  let system = LESSON_SYSTEM_PROMPT

  if (req.mode === 'photo') {
    system += PHOTO_ADDENDUM
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: req.image.mediaType, data: req.image.data },
    })
    content.push({
      type: 'text',
      text:
        `Design a wet-on-wet lesson that turns this photo into a painting.` +
        (req.note.trim() ? ` The painter adds: "${req.note.trim()}"` : ''),
    })
  } else {
    const prompt = req.prompt.trim()
    content.push({
      type: 'text',
      text: prompt
        ? `Design a wet-on-wet lesson for this painting idea: "${prompt}"`
        : 'Imagine a classic wet-on-wet landscape that a beginner can finish in one session, and design the lesson for it. Surprise me.',
    })
  }

  let response: ParsedMessage<LessonContent>
  try {
    response = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system,
      thinking: { type: 'adaptive' },
      output_config: { effort: effort(), format: zodOutputFormat(LessonSchema) },
      messages: [{ role: 'user', content }],
    })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new LessonGenerationError('The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.', 500)
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new LessonGenerationError('The studio is busy right now. Try again in a moment.', 429)
    }
    if (error instanceof Anthropic.BadRequestError) {
      throw new LessonGenerationError(`The request was rejected: ${error.message}`, 400)
    }
    if (error instanceof Anthropic.APIError) {
      throw new LessonGenerationError(`Anthropic API error (${error.status}): ${error.message}`, 502)
    }
    throw error
  }

  if (response.stop_reason === 'refusal') {
    const why = response.stop_details?.explanation ?? 'the request was declined'
    throw new LessonGenerationError(`I can't paint that one: ${why}`, 422)
  }
  if (response.stop_reason === 'max_tokens') {
    throw new LessonGenerationError('The lesson came out too long to finish. Try a simpler scene.', 502)
  }
  if (!response.parsed_output) {
    throw new LessonGenerationError('The lesson could not be parsed. Please try again.', 502)
  }

  return normalize(response.parsed_output)
}

// Light post-processing so the renderer never sees out-of-range values.
function normalize(lesson: LessonContent): LessonContent {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  return {
    ...lesson,
    composition: {
      ...lesson.composition,
      horizonY: clamp(lesson.composition.horizonY, 0, 75),
      focalPoint: {
        x: clamp(lesson.composition.focalPoint.x, 0, 100),
        y: clamp(lesson.composition.focalPoint.y, 0, 75),
      },
    },
    steps: lesson.steps.map((step) => ({
      ...step,
      minutes: Math.max(1, Math.round(step.minutes)),
      layers: step.layers
        .filter((l) => l.points.length >= 3)
        .map((l) => ({
          ...l,
          opacity: clamp(l.opacity, 0.05, 1),
          points: l.points.map((p) => ({ x: clamp(p.x, -5, 105), y: clamp(p.y, -5, 80) })),
        })),
    })),
  }
}
