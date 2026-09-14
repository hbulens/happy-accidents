import { describe, expect, it } from 'vitest'
import { STYLE_PROMPT, revealSteps, CANVAS_W, CANVAS_H } from '@/features/lessons/server/images'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { firstUrl } from '@/lib/replicate'
import { createCanvas, decodeJpeg, drawGrid, polygonMask, unionMask } from '@/lib/raster'

describe('replicate helpers', () => {
  it('normalises outputs to a single url', () => {
    expect(firstUrl('https://x/y.webp')).toBe('https://x/y.webp')
    expect(firstUrl(['https://x/a.webp', 'https://x/b.webp'])).toBe('https://x/a.webp')
    expect(() => firstUrl({})).toThrow()
  })
  it('style prompt asks for the wet-on-wet look, unsigned', () => {
    expect(STYLE_PROMPT).toMatch(/wet-on-wet/)
    expect(STYLE_PROMPT).toMatch(/unsigned/)
  })
})

describe('raster', () => {
  it('rasterises a polygon into the right area and unions masks', () => {
    const a = polygonMask([[{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 75 }, { x: 0, y: 75 }]], 100, 75, 0)
    const b = polygonMask([[{ x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 75 }, { x: 50, y: 75 }]], 100, 75, 0)
    expect(a[10 * 100 + 10]).toBe(1)
    expect(a[10 * 100 + 80]).toBe(0)
    const u = unionMask(a, b)
    expect(u[10 * 100 + 80]).toBe(1)
  })
  it('draws a grid without changing the size', () => {
    const g = drawGrid(createCanvas(200, 150, '#ffffff'))
    expect(g.width).toBe(200)
    expect(g.data[(75 * 200 + 3) * 4]).toBe(255) // red line at y=50 lesson units
  })
})

describe('revealSteps', () => {
  it('reveals monotonically: each step shows at least what the previous showed', () => {
    const final = createCanvas(CANVAS_W, CANVAS_H, '#204060')
    const regions = {
      steps: DEMO_LESSON.steps.map((_, i) => ({
        index: i,
        polygons: i === 1 ? [{ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 0, y: 40 }] }] : i === 2 ? [{ points: [{ x: 0, y: 40 }, { x: 100, y: 40 }, { x: 100, y: 75 }, { x: 0, y: 75 }] }] : [],
      })),
    }
    const frames: { index: number; kind: string; dataUrl: string }[] = []
    revealSteps(DEMO_LESSON, final, regions, (e) => frames.push(e))
    expect(frames.filter((f) => f.kind === 'step')).toHaveLength(DEMO_LESSON.steps.length)
    const px = (dataUrl: string, x: number, y: number) => {
      const img = decodeJpeg(new Uint8Array(Buffer.from(dataUrl.split(',')[1], 'base64')))
      return img.data[(y * img.width + x) * 4]
    }
    const step0 = frames[0].dataUrl
    const step1 = frames[1].dataUrl
    const step2 = frames[2].dataUrl
    expect(px(step0, 100, 100)).toBeGreaterThan(200) // blank canvas is light
    expect(px(step1, 100, 100)).toBeLessThan(80) // sky revealed (dark test colour)
    expect(px(step1, 100, 700)).toBeGreaterThan(200) // lake not yet
    expect(px(step2, 100, 700)).toBeLessThan(80)
  })
})
