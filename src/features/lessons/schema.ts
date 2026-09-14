import { z } from 'zod'

// Shared between server (structured output contract) and client (rendering).
// Keep the schema free of numeric constraints and optional() so it maps
// cleanly onto the structured-outputs JSON schema subset. Use nullable() for
// fields that may be absent; ranges are clamped in the renderer.

export const PhaseSchema = z.enum([
  'prep',
  'sky',
  'water',
  'mountains',
  'background',
  'midground',
  'foreground',
  'details',
  'finish',
])
export type Phase = z.infer<typeof PhaseSchema>

export const PointSchema = z.object({
  x: z.number().describe('0 = left edge, 100 = right edge of the canvas'),
  y: z.number().describe('0 = top edge, 75 = bottom edge of the canvas (4:3 aspect)'),
})
export type Point = z.infer<typeof PointSchema>

export const StepSchema = z.object({
  title: z.string().describe('Short step name, e.g. "Happy little clouds"'),
  phase: PhaseSchema,
  tool: z.string().describe('Main brush or knife used, plain name, e.g. "2-inch background brush"'),
  colors: z.array(z.string()).describe('Palette color names used in this step, matching lesson.palette names'),
  instruction: z
    .string()
    .describe(
      'The teaching narration for this step, spoken in the instructor voice: 4 to 7 sentences, concrete brush motion, pressure, direction and where on the canvas',
    ),
  technique: z.string().describe('Name of the technique, e.g. "criss-cross strokes", "tapping", "pulling down reflections"'),
  brushLoading: z.string().describe('How to load the brush or knife: how much paint, how thin, which edge'),
  tips: z.array(z.string()).describe('2 to 3 short practical tips'),
  watchOut: z.string().describe('The most common mistake in this step and how to avoid it'),
  happyAccident: z
    .string()
    .nullable()
    .describe('If something goes wrong here, how to turn it into a feature. Null if not applicable.'),
  minutes: z.number().describe('Estimated minutes for this step'),
  canvasAfter: z
    .string()
    .describe(
      'What is on the canvas after this step is finished, cumulative, 1 to 3 plain sentences, for generating a progress image: e.g. "A blended pale blue sky with soft white clouds covers the top half. Below the horizon the canvas is still bare white."',
    ),
})
export type Step = z.infer<typeof StepSchema>

export const PaletteColorSchema = z.object({
  name: z.string().describe('Color name, e.g. "Phthalo Blue"'),
  hex: z.string().describe('CSS hex approximation of the color straight from the tube'),
  role: z.string().describe('What it is used for in this painting'),
})

export const ToolSchema = z.object({
  name: z.string(),
  role: z.string().describe('What it is used for in this painting'),
})

export const LessonSchema = z.object({
  title: z.string().describe('Painting title, like an episode name'),
  intro: z
    .string()
    .describe('Warm 3 to 5 sentence welcome in the instructor voice describing what we will paint today'),
  sceneDescription: z
    .string()
    .describe('Plain 2 to 4 sentence description of the finished painting, used as the reference'),
  mood: z.string().describe('One line: season, time of day, light, feeling'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  canvas: z.string().describe('Recommended canvas, e.g. "18 x 24 inch stretched canvas"'),
  totalMinutes: z.number(),
  basecoat: z.string().describe('Base coat instruction, usually a thin even coat of Liquid White'),
  palette: z.array(PaletteColorSchema).describe('Only the colors needed for this painting'),
  tools: z.array(ToolSchema).describe('Only the brushes and knives needed'),
  paintingPrompt: z
    .string()
    .describe(
      'A vivid 60 to 100 word description of the FINISHED painting for an image model: subject, composition left to right and near to far, light direction, time of day, colors, mood. Plain description only, no instructions to the painter.',
    ),
  composition: z.object({
    horizonY: z.number().describe('Horizon line height, 0 top to 75 bottom'),
    focalPoint: PointSchema,
    notes: z.string().describe('Composition reasoning: where the eye goes and why'),
  }),
  steps: z.array(StepSchema).describe('10 to 14 steps, in painting order, background to foreground'),
  closing: z.string().describe('Sign-off in the instructor voice, 2 to 3 sentences'),
  adaptationNotes: z
    .string()
    .nullable()
    .describe('When painting from a photo: what was simplified, moved or dropped and why. Null otherwise.'),
})
export type LessonContent = z.infer<typeof LessonSchema>

export type LessonSource =
  | { mode: 'imagine'; prompt: string }
  | { mode: 'photo'; note: string; thumbnail: string | null }
  | { mode: 'demo' }

export interface Lesson extends LessonContent {
  id: string
  createdAt: string
  source: LessonSource
}

export const GenerateRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('imagine'),
    prompt: z.string().max(2000),
  }),
  z.object({
    mode: z.literal('photo'),
    note: z.string().max(2000),
    image: z.object({
      mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
      data: z.string().max(6_000_000),
    }),
  }),
])
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>

export const AskRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  lesson: z.object({
    title: z.string(),
    sceneDescription: z.string(),
    palette: z.array(z.string()),
  }),
  step: z
    .object({
      index: z.number(),
      title: z.string(),
      tool: z.string(),
      colors: z.array(z.string()),
      instruction: z.string(),
    })
    .nullable(),
})
export type AskRequest = z.infer<typeof AskRequestSchema>
