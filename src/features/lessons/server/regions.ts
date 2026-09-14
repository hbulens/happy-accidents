// Maps each lesson step to the area it paints on the finished picture, using
// Claude with vision on a grid-overlaid copy of the painting.
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { anthropic } from '@/lib/anthropic'
import { PointSchema, type LessonContent, type Point } from '@/features/lessons/schema'

const MODEL = 'claude-opus-5'

export const RegionsSchema = z.object({
  steps: z.array(
    z.object({
      index: z.number().describe('Zero-based step index'),
      polygons: z
        .array(z.object({ points: z.array(PointSchema).describe('4 to 12 vertices, clockwise') }))
        .describe('The areas this step paints, as seen on the finished picture. Empty for a step that adds no new area (the base coat, blending, mist).'),
    }),
  ),
})
export type Regions = z.infer<typeof RegionsSchema>

const SYSTEM = `You map the steps of a wet-on-wet oil painting lesson onto the finished picture.

The picture has a coordinate grid drawn over it: thin dark lines every 10 units, thick red lines at x=0, x=50, x=100 and y=0, y=50. Coordinates run x from 0 (left edge) to 100 (right edge) and y from 0 (top edge) to 75 (bottom edge).

For every step, give the polygon(s) that outline exactly the area that step paints, as it appears in the finished picture: the sky step outlines the visible sky (down to the mountain ridge or horizon), the mountain step outlines the mountains, a tree step outlines those trees, a cabin step the cabin, a snowbank step the snowbanks, and so on. Follow visible edges closely with 6 to 12 points; separate objects get separate polygons. Steps that only modify existing paint (base coat, blending, mist, highlights on already painted shapes, the signature) get an empty list. Together, the polygons of all steps should cover the whole picture.`

export async function mapRegions(lesson: LessonContent, gridJpegBase64: string): Promise<Regions> {
  const stepList = lesson.steps.map((s, i) => `${i}. ${s.title}: paints ${s.paintsIn}`).join('\n')
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: zodOutputFormat(RegionsSchema) },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: gridJpegBase64 } },
          { type: 'text', text: `Steps:\n${stepList}\n\nOutline the area each step paints on this picture.` },
        ],
      },
    ],
  })
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Anthropic.AnthropicError('Could not map the lesson steps onto the picture.')
  }
  return normalise(response.parsed_output, lesson.steps.length)
}

function normalise(regions: Regions, count: number): Regions {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const byIndex = new Map<number, Point[][]>()
  for (const s of regions.steps) {
    if (s.index < 0 || s.index >= count) continue
    byIndex.set(
      s.index,
      s.polygons
        .map((p) => p.points.map((pt) => ({ x: clamp(pt.x, 0, 100), y: clamp(pt.y, 0, 75) })))
        .filter((p) => p.length >= 3),
    )
  }
  return {
    steps: Array.from({ length: count }, (_, i) => ({ index: i, polygons: (byIndex.get(i) ?? []).map((points) => ({ points })) })),
  }
}
