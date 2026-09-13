import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from '@/lib/anthropic'
import type { AskRequest } from '@/features/lessons/schema'
import { ASK_SYSTEM_PROMPT } from '@/features/lessons/prompts'

const MODEL = 'claude-opus-5'

export class AskError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export async function askInstructor(req: AskRequest): Promise<string> {
  const context = [
    `Painting: ${req.lesson.title}`,
    `Scene: ${req.lesson.sceneDescription}`,
    `Palette: ${req.lesson.palette.join(', ')}`,
    req.step
      ? `Current step ${req.step.index + 1}: ${req.step.title}. Tool: ${req.step.tool}. Colors: ${req.step.colors.join(', ')}. Instruction: ${req.step.instruction}`
      : 'The painter has not started a step yet.',
    '',
    `The painter asks: "${req.question.trim()}"`,
  ].join('\n')

  let response: Anthropic.Message
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: ASK_SYSTEM_PROMPT,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: context }],
    })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AskError('The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.', 500)
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AskError('Give me a second, the studio is busy.', 429)
    }
    if (error instanceof Anthropic.APIError) {
      throw new AskError(`Anthropic API error (${error.status}): ${error.message}`, 502)
    }
    throw error
  }

  if (response.stop_reason === 'refusal') {
    throw new AskError("Let's keep it to painting, friend.", 422)
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
  if (!text) throw new AskError('The instructor went quiet. Ask again.', 502)
  return text
}
