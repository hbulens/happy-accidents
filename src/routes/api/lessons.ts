import { createFileRoute } from '@tanstack/react-router'
import { GenerateRequestSchema } from '@/features/lessons/schema'
import { generateLesson, LessonGenerationError } from '@/features/lessons/server/generate-lesson'
import { hasAnthropicKey } from '@/lib/anthropic'
import { errorResponse, jsonResponse } from '@/lib/http'

/**
 * POST /api/lessons
 * Body: GenerateRequest ({ mode: 'imagine', prompt } | { mode: 'photo', note, image })
 * Returns: LessonContent
 */
async function handler({ request }: { request: Request }): Promise<Response> {
  if (!hasAnthropicKey()) {
    return errorResponse(
      'ANTHROPIC_API_KEY is not configured on the server. Add it to .env, or open the demo lesson.',
      503,
    )
  }
  const body = await request.json().catch(() => null)
  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(`Invalid request: ${parsed.error.issues[0]?.message ?? 'bad body'}`, 400)
  }
  try {
    const lesson = await generateLesson(parsed.data)
    return jsonResponse(lesson)
  } catch (error) {
    if (error instanceof LessonGenerationError) return errorResponse(error.message, error.status)
    console.error('[lessons] generation failed:', error)
    return errorResponse('Lesson generation failed unexpectedly.', 500)
  }
}

export const Route = createFileRoute('/api/lessons')({
  server: { handlers: { POST: handler } },
})
