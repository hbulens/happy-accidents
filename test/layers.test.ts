import { describe, expect, it } from 'vitest'
import { layersThrough, pointsAttr, totalMinutes } from '@/features/lessons/utils/layers'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'

describe('layersThrough', () => {
  it('accumulates layers from step 0 through the given step', () => {
    const first = layersThrough(DEMO_LESSON.steps, 0)
    expect(first).toHaveLength(DEMO_LESSON.steps[0].layers.length)
    const all = layersThrough(DEMO_LESSON.steps, DEMO_LESSON.steps.length - 1)
    const expected = DEMO_LESSON.steps.reduce((n, s) => n + s.layers.length, 0)
    expect(all).toHaveLength(expected)
    expect(all.every((l, i) => i === 0 || all[i - 1].stepIndex <= l.stepIndex)).toBe(true)
  })

  it('clamps beyond the last step', () => {
    expect(layersThrough(DEMO_LESSON.steps, 999)).toHaveLength(layersThrough(DEMO_LESSON.steps, DEMO_LESSON.steps.length - 1).length)
  })
})

describe('pointsAttr', () => {
  it('formats polygon points for SVG', () => {
    expect(pointsAttr({ label: 'x', points: [{ x: 0, y: 0 }, { x: 10.123, y: 5 }], fill: '#000', opacity: 1, soft: false })).toBe(
      '0,0 10.12,5',
    )
  })
})

describe('totalMinutes', () => {
  it('sums step minutes when present', () => {
    expect(totalMinutes(DEMO_LESSON)).toBe(DEMO_LESSON.steps.reduce((n, s) => n + s.minutes, 0))
  })
  it('falls back to the lesson total', () => {
    expect(totalMinutes({ steps: [], totalMinutes: 42 })).toBe(42)
  })
})
