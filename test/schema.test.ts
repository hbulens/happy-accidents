import { describe, expect, it } from 'vitest'
import { AskRequestSchema, GenerateRequestSchema, LessonSchema } from '@/features/lessons/schema'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { KNOWN_COLORS } from '@/features/lessons/palette'

describe('LessonSchema', () => {
  it('accepts the demo lesson', () => {
    expect(LessonSchema.safeParse(DEMO_LESSON).success).toBe(true)
  })

  it('demo lesson only uses palette colors it declares, and those are classic palette colors', () => {
    const names = new Set(DEMO_LESSON.palette.map((c) => c.name.toLowerCase()))
    for (const step of DEMO_LESSON.steps) {
      for (const c of step.colors) expect(names.has(c.toLowerCase())).toBe(true)
    }
    for (const name of names) expect(KNOWN_COLORS[name]).toBeDefined()
  })

  it('demo lesson ends with the finish phase and starts with prep', () => {
    expect(DEMO_LESSON.steps[0].phase).toBe('prep')
    expect(DEMO_LESSON.steps.at(-1)?.phase).toBe('finish')
  })

  it('every demo step describes the canvas after it, and the lesson has a painting prompt', () => {
    expect(DEMO_LESSON.paintingPrompt.length).toBeGreaterThan(100)
    for (const step of DEMO_LESSON.steps) expect(step.canvasAfter.length).toBeGreaterThan(40)
  })
})

describe('request schemas', () => {
  it('validates imagine and photo requests', () => {
    expect(GenerateRequestSchema.safeParse({ mode: 'imagine', prompt: 'a lake' }).success).toBe(true)
    expect(
      GenerateRequestSchema.safeParse({ mode: 'photo', note: '', image: { mediaType: 'image/jpeg', data: 'abc' } }).success,
    ).toBe(true)
    expect(GenerateRequestSchema.safeParse({ mode: 'photo', note: '' }).success).toBe(false)
    expect(GenerateRequestSchema.safeParse({ mode: 'nope' }).success).toBe(false)
  })

  it('validates ask requests', () => {
    expect(
      AskRequestSchema.safeParse({
        question: 'help',
        lesson: { title: 't', sceneDescription: 's', palette: [] },
        step: null,
      }).success,
    ).toBe(true)
    expect(AskRequestSchema.safeParse({ question: '', lesson: { title: 't', sceneDescription: 's', palette: [] }, step: null }).success).toBe(false)
  })
})
