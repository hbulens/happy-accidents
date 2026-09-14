// Maps each lesson step onto the finished picture using Claude with vision on
// a grid-overlaid copy. Two outlines per step: what is still visible of that
// step's paint in the finished picture, and the full extent the painter
// covers in that step (including what later steps paint over).
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { anthropic } from '@/lib/anthropic'
import { PointSchema, type LessonContent, type Point } from '@/features/lessons/schema'

const MODEL = 'claude-opus-5'

const PolygonSchema = z.object({ points: z.array(PointSchema).describe('10 to 24 vertices tracing the edge, clockwise') })

export const RegionsSchema = z.object({
  steps: z.array(
    z.object({
      index: z.number().describe('Zero-based step index'),
      visible: z
        .array(PolygonSchema)
        .describe('Outlines of this step\'s paint as still visible in the finished picture. Empty for a step that adds no new area.'),
      extent: z
        .array(PolygonSchema)
        .describe(
          'Outlines of the whole area the painter covers in this step, including parts later steps paint over. For the sky: everything above the horizon, straight through the mountains and trees. Empty for a step that adds no new area.',
        ),
    }),
  ),
})
export type Regions = z.infer<typeof RegionsSchema>

const SYSTEM = `You map the steps of a wet-on-wet oil painting lesson onto the finished picture.

The picture has a labelled coordinate grid drawn over it: thin dark lines every 10 units with their value printed in yellow digits (x values along the vertical lines, y values along the horizontal lines), thick red lines at x=0, x=50, x=100 and y=0, y=50. Coordinates run x from 0 (left edge) to 100 (right edge) and y from 0 (top edge) to 75 (bottom edge). Read positions off the labels and interpolate between grid lines to one decimal.

For every step give two sets of polygons:
1. visible: exactly the area where this step's paint is still visible in the finished picture. The sky step outlines the visible sky down to the mountain ridge and around the tree tops; the mountain step outlines the visible mountains; a tree step outlines those trees; a cabin step the cabin; a snowbank step the visible snowbanks. Trace visible edges closely with 10 to 24 points (a tree is a jagged triangle whose tip and skirt you follow; a ridge is traced peak by peak). Separate objects get separate polygons. A polygon must not include paint that belongs to a later step. Together, the visible polygons of all steps cover the whole picture.
2. extent: the whole area the painter covers in this step, as painted in a wet-on-wet lesson where each layer goes on top of the last: the sky is painted over everything above the horizon, straight through where mountains and trees will later go; water is painted over everything below the horizon, under later snowbanks and cabins; mountains are their full shapes including where trees will stand in front; foreground snow covers its full bank shapes under later bushes and footprints. Extent always contains the visible area. Use simple polygons of 4 to 12 points.

Steps that only modify existing paint (base coat, blending, mist, highlights on already painted shapes, the signature) get empty lists.`

export async function mapRegions(lesson: LessonContent, gridJpegBase64: string): Promise<Regions> {
  const stepList = lesson.steps.map((s, i) => `${i}. ${s.title}: paints ${s.paintsIn}`).join('\n')
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 24000,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: zodOutputFormat(RegionsSchema) },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: gridJpegBase64 } },
          { type: 'text', text: `Steps:\n${stepList}\n\nOutline, for each step, what is visible of it and the full extent it covers.` },
        ],
      },
    ],
  })
  const response = await stream.finalMessage()
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Anthropic.AnthropicError('Could not map the lesson steps onto the picture.')
  }
  return normalise(response.parsed_output, lesson.steps.length)
}

function normalise(regions: Regions, count: number): Regions {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  const clean = (polys: { points: Point[] }[]) =>
    polys
      .map((p) => ({ points: p.points.map((pt) => ({ x: clamp(pt.x, 0, 100), y: clamp(pt.y, 0, 75) })) }))
      .filter((p) => p.points.length >= 3)
  const byIndex = new Map<number, { visible: { points: Point[] }[]; extent: { points: Point[] }[] }>()
  for (const s of regions.steps) {
    if (s.index < 0 || s.index >= count) continue
    const visible = clean(s.visible)
    const extent = clean(s.extent)
    byIndex.set(s.index, { visible, extent: extent.length ? [...extent, ...visible] : visible })
  }
  return {
    steps: Array.from({ length: count }, (_, i) => ({ index: i, ...(byIndex.get(i) ?? { visible: [], extent: [] }) })),
  }
}
