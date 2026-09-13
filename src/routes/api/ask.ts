import { createFileRoute } from '@tanstack/react-router'
import { AskRequestSchema } from '@/features/lessons/schema'
import { askInstructor, AskError } from '@/features/lessons/server/ask-instructor'
import { hasAnthropicKey } from '@/lib/anthropic'
import { errorResponse, jsonResponse } from '@/lib/http'

/**
 * POST /api/ask
 * Body: AskRequest
 * Returns: { answer: string }
 */
async function handler({ request }: { request: Request }): Promise<Response> {
  if (!hasAnthropicKey()) {
    return errorResponse('ANTHROPIC_API_KEY is not configured on the server.', 503)
  }
  const body = await request.json().catch(() => null)
  const parsed = AskRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(`Invalid request: ${parsed.error.issues[0]?.message ?? 'bad body'}`, 400)
  }
  try {
    const answer = await askInstructor(parsed.data)
    return jsonResponse({ answer })
  } catch (error) {
    if (error instanceof AskError) return errorResponse(error.message, error.status)
    console.error('[ask] failed:', error)
    return errorResponse('The instructor could not answer right now.', 500)
  }
}

export const Route = createFileRoute('/api/ask')({
  server: { handlers: { POST: handler } },
})
