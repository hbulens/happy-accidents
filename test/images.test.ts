import { describe, expect, it } from 'vitest'
import { STYLE_PROMPT, stepPrompt } from '@/features/lessons/server/images'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { firstUrl } from '@/lib/replicate'

describe('replicate helpers', () => {
  it('normalises outputs to a single url', () => {
    expect(firstUrl('https://x/y.webp')).toBe('https://x/y.webp')
    expect(firstUrl(['https://x/a.webp', 'https://x/b.webp'])).toBe('https://x/a.webp')
    expect(() => firstUrl({})).toThrow()
  })
  it('style prompt asks for the wet-on-wet look and no chrome', () => {
    expect(STYLE_PROMPT).toMatch(/wet-on-wet/)
    expect(STYLE_PROMPT).toMatch(/no frame/)
  })
})

describe('stepPrompt', () => {
  it('removes only the steps between the picture and its anchor, and states what remains', () => {
    const p = stepPrompt(DEMO_LESSON, 5, 8)
    for (const step of DEMO_LESSON.steps.slice(6, 9)) expect(p).toContain(step.paintsIn)
    expect(p).not.toContain(DEMO_LESSON.steps[9].paintsIn)
    expect(p).not.toContain(DEMO_LESSON.steps[5].paintsIn)
    expect(p).toContain(DEMO_LESSON.steps[5].canvasAfter)
    expect(p).not.toMatch(/\bno signature\b/i)
  })
})
