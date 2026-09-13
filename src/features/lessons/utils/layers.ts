import type { Layer, Lesson, Step } from '@/features/lessons/schema'

export const CANVAS_W = 100
export const CANVAS_H = 75

export interface PlacedLayer extends Layer {
  key: string
  stepIndex: number
}

/** All layers painted up to and including `throughStep` (inclusive index). */
export function layersThrough(steps: Step[], throughStep: number): PlacedLayer[] {
  const out: PlacedLayer[] = []
  const last = Math.min(throughStep, steps.length - 1)
  for (let i = 0; i <= last; i++) {
    steps[i].layers.forEach((layer, j) => {
      out.push({ ...layer, key: `${i}-${j}`, stepIndex: i })
    })
  }
  return out
}

export function pointsAttr(layer: Layer): string {
  return layer.points.map((p) => `${round(p.x)},${round(p.y)}`).join(' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function totalMinutes(lesson: Pick<Lesson, 'steps' | 'totalMinutes'>): number {
  const sum = lesson.steps.reduce((acc, s) => acc + (s.minutes || 0), 0)
  return sum > 0 ? sum : lesson.totalMinutes
}
