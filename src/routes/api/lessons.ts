import { createFileRoute } from '@tanstack/react-router'
import { GenerateRequestSchema } from '@/features/lessons/schema'
import { generateLesson, LessonGenerationError, type GenerationProgress } from '@/features/lessons/server/generate-lesson'
import { paintFinal, paintSteps } from '@/features/lessons/server/images'
import { hasAnthropicKey } from '@/lib/anthropic'
import { hasReplicateToken } from '@/lib/replicate'
import { errorResponse } from '@/lib/http'

/**
 * POST /api/lessons
 * Body: GenerateRequest ({ mode: 'imagine', prompt } | { mode: 'photo', note, image })
 * Returns a Server-Sent Events stream:
 *   progress   GenerationProgress            (while the lesson text streams)
 *   lesson     LessonContent                 (the text is complete)
 *   image      { kind:'final'|'step', index, dataUrl }
 *   image-error{ kind, index, error }
 *   done       { images: boolean }
 *   error      { message, status }           (fatal; the lesson could not be made)
 */
async function handler({ request }: { request: Request }): Promise<Response> {
  if (!hasAnthropicKey()) {
    return errorResponse('ANTHROPIC_API_KEY is not configured on the server. Add it to .env, or open the demo lesson.', 503)
  }
  const body = await request.json().catch(() => null)
  const parsed = GenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(`Invalid request: ${parsed.error.issues[0]?.message ?? 'bad body'}`, 400)
  }
  const req = parsed.data

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }
      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'))
          } catch {
            closed = true
          }
        }
      }, 15000)
      try {
        const lesson = await generateLesson(req, (p: GenerationProgress) => send('progress', p))
        send('lesson', lesson)

        if (!hasReplicateToken()) {
          send('image-error', { kind: 'final', index: -1, error: 'REPLICATE_API_TOKEN is not set, so no pictures were painted.' })
          send('done', { images: false })
          return
        }

        send('progress', { type: 'status', phase: 'painting', message: 'Painting the finished picture' })
        let final: { url: string; dataUrl: string }
        try {
          final = await paintFinal(lesson, req.mode === 'photo' ? req.image : null)
        } catch (e) {
          send('image-error', { kind: 'final', index: -1, error: e instanceof Error ? e.message : String(e) })
          send('done', { images: false })
          return
        }
        send('image', { kind: 'final', index: lesson.steps.length - 1, dataUrl: final.dataUrl })

        send('progress', { type: 'status', phase: 'painting', message: 'Painting each step' })
        await paintSteps(
          final.url,
          lesson,
          (img) => send('image', img),
          (err) => send('image-error', err),
        )
        send('done', { images: true })
      } catch (error) {
        if (error instanceof LessonGenerationError) {
          send('error', { message: error.message, status: error.status })
        } else {
          console.error('[lessons] generation failed:', error)
          send('error', { message: 'Lesson generation failed unexpectedly.', status: 500 })
        }
      } finally {
        clearInterval(heartbeat)
        if (!closed) controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export const Route = createFileRoute('/api/lessons')({
  server: { handlers: { POST: handler } },
})
