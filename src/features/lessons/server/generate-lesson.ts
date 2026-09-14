import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { anthropic } from '@/lib/anthropic'
import { LessonSchema, type GenerateRequest, type LessonContent } from '@/features/lessons/schema'
import { LESSON_SYSTEM_PROMPT, PHOTO_ADDENDUM } from '@/features/lessons/prompts'

const MODEL = 'claude-opus-5'
// Streaming lets us use a generous ceiling. Thinking tokens count against
// max_tokens, so a 16K ceiling truncated real lessons mid-JSON.
const MAX_TOKENS = 64000

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

function effort(): Effort {
  const v = process.env.HAPPY_ACCIDENTS_EFFORT
  if (v === 'low' || v === 'medium' || v === 'high' || v === 'xhigh' || v === 'max') return v
  return 'medium'
}

export class LessonGenerationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export type GenerationProgress =
  | { type: 'status'; phase: 'looking' | 'thinking' | 'writing' | 'painting'; message: string }
  | { type: 'step'; index: number; title: string }
  | { type: 'title'; title: string }
  | { type: 'chars'; count: number }

export async function generateLesson(
  req: GenerateRequest,
  onProgress: (p: GenerationProgress) => void = () => {},
): Promise<LessonContent> {
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
    onProgress({ type: 'status', phase: 'looking', message: 'Studying your photo' })
  } else {
    const prompt = req.prompt.trim()
    content.push({
      type: 'text',
      text: prompt
        ? `Design a wet-on-wet lesson for this painting idea: "${prompt}"`
        : 'Imagine a classic wet-on-wet landscape that a beginner can finish in one session, and design the lesson for it. Surprise me.',
    })
    onProgress({ type: 'status', phase: 'thinking', message: 'Dreaming up the scene' })
  }

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    thinking: { type: 'adaptive' },
    output_config: { effort: effort(), format: zodOutputFormat(LessonSchema) },
    messages: [{ role: 'user', content }],
  })

  const tracker = new ProgressTracker(onProgress)
  let stopReason: string | null = null
  let text = ''

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'thinking_delta') tracker.thinking()
        else if (event.delta.type === 'text_delta') {
          text += event.delta.text
          tracker.text(text)
        }
      } else if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason ?? stopReason
      }
    }
  } catch (error) {
    throw translateError(error, stopReason)
  }

  if (stopReason === 'refusal') {
    throw new LessonGenerationError("I can't paint that one. Try a different scene.", 422)
  }
  if (stopReason === 'max_tokens') {
    throw new LessonGenerationError('The lesson came out too long to finish. Try a simpler scene.', 502)
  }

  let final: Awaited<ReturnType<typeof stream.finalMessage>>
  try {
    final = await stream.finalMessage()
  } catch (error) {
    throw translateError(error, stopReason)
  }

  const parsed = final.parsed_output ?? safeParse(text)
  if (!parsed) throw new LessonGenerationError('The lesson could not be parsed. Please try again.', 502)
  return normalize(parsed)
}

function translateError(error: unknown, stopReason: string | null): Error {
  if (error instanceof LessonGenerationError) return error
  if (error instanceof Anthropic.AuthenticationError) {
    return new LessonGenerationError('The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.', 500)
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new LessonGenerationError('The studio is busy right now. Try again in a moment.', 429)
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new LessonGenerationError(`The request was rejected: ${error.message}`, 400)
  }
  if (error instanceof Anthropic.APIError) {
    return new LessonGenerationError(`Anthropic API error (${error.status}): ${error.message}`, 502)
  }
  if (error instanceof Anthropic.AnthropicError && /parse structured output/i.test(error.message)) {
    if (stopReason === 'max_tokens') {
      return new LessonGenerationError('The lesson came out too long to finish. Try a simpler scene.', 502)
    }
    return new LessonGenerationError('The lesson came back malformed. Please try again.', 502)
  }
  return error instanceof Error ? error : new Error(String(error))
}

function safeParse(text: string): LessonContent | null {
  try {
    const result = LessonSchema.safeParse(JSON.parse(text))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Watches the streamed JSON text and reports the lesson title and each step
 * title as soon as they appear, so the client can show real progress.
 */
class ProgressTracker {
  private phase: 'thinking' | 'writing' | null = null
  private titleSent = false
  private stepsSeen = 0
  private lastChars = 0

  constructor(private readonly emit: (p: GenerationProgress) => void) {}

  thinking() {
    if (this.phase === null) {
      this.phase = 'thinking'
      this.emit({ type: 'status', phase: 'thinking', message: 'Planning the composition' })
    }
  }

  text(accumulated: string) {
    if (this.phase !== 'writing') {
      this.phase = 'writing'
      this.emit({ type: 'status', phase: 'writing', message: 'Writing the lesson' })
    }
    if (!this.titleSent) {
      const m = accumulated.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/)
      if (m) {
        this.titleSent = true
        this.emit({ type: 'title', title: unescape(m[1]) })
      }
    }
    const stepsAt = accumulated.indexOf('"steps"')
    if (stepsAt >= 0) {
      const tail = accumulated.slice(stepsAt)
      const titles = [...tail.matchAll(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
      while (this.stepsSeen < titles.length) {
        this.emit({ type: 'step', index: this.stepsSeen, title: unescape(titles[this.stepsSeen][1]) })
        this.stepsSeen++
      }
    }
    if (accumulated.length - this.lastChars > 2000) {
      this.lastChars = accumulated.length
      this.emit({ type: 'chars', count: accumulated.length })
    }
  }
}

function unescape(s: string): string {
  try {
    return JSON.parse(`"${s}"`)
  } catch {
    return s
  }
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
    })),
  }
}
