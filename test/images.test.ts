import { describe, expect, it } from 'vitest'
import { STYLE_PROMPT, buildSteps, CANVAS_W, CANVAS_H } from '@/features/lessons/server/images'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { firstUrl } from '@/lib/replicate'
import { createCanvas, decodeJpeg, drawGrid, polygonMask, unionMask, labelMap } from '@/lib/raster'

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
  it('labels every pixel, later regions win, gaps are grown into', () => {
    const left = [[{ x: 0, y: 0 }, { x: 45, y: 0 }, { x: 45, y: 75 }, { x: 0, y: 75 }]]
    const right = [[{ x: 55, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 75 }, { x: 55, y: 75 }]]
    const blob = [[{ x: 40, y: 30 }, { x: 60, y: 30 }, { x: 60, y: 45 }, { x: 40, y: 45 }]]
    const labels = labelMap([left, right, blob], 100, 75, 2)
    expect(labels[10 * 100 + 10]).toBe(0)
    expect(labels[10 * 100 + 90]).toBe(1)
    expect(labels[37 * 100 + 50]).toBe(2) // blob overwrites the gap
    expect(labels[10 * 100 + 50]).toBeGreaterThanOrEqual(0) // gap grown into
    expect(Array.from(labels).every((l) => l >= 0)).toBe(true)
  })
  it('draws a grid without changing the size', () => {
    const g = drawGrid(createCanvas(200, 150, '#ffffff'))
    expect(g.width).toBe(200)
    expect(g.data[(75 * 200 + 3) * 4]).toBe(255) // red line at y=50 lesson units
  })
})

describe('buildSteps', () => {
  it('adds paint monotonically without any model call when nothing is hidden', async () => {
    const final = createCanvas(CANVAS_W, CANVAS_H, '#204060')
    const top = [{ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 0, y: 40 }] }]
    const bottom = [{ points: [{ x: 0, y: 40 }, { x: 100, y: 40 }, { x: 100, y: 75 }, { x: 0, y: 75 }] }]
    const regions = {
      steps: DEMO_LESSON.steps.map((_, i) => ({
        index: i,
        visible: i === 1 ? top : i === 2 ? bottom : [],
        extent: i === 1 ? top : i === 2 ? bottom : [],
      })),
    }
    const frames: { index: number; kind: string; dataUrl: string }[] = []
    const errors: unknown[] = []
    await buildSteps(DEMO_LESSON, final, regions, (e) => frames.push(e), (e) => errors.push(e), () => {})
    expect(errors).toHaveLength(0)
    expect(frames.filter((f) => f.kind === 'step')).toHaveLength(DEMO_LESSON.steps.length)
    const px = (dataUrl: string, x: number, y: number) => {
      const img = decodeJpeg(new Uint8Array(Buffer.from(dataUrl.split(',')[1], 'base64')))
      return img.data[(y * img.width + x) * 4]
    }
    expect(px(frames[0].dataUrl, 100, 100)).toBeGreaterThan(200) // blank canvas is light
    expect(px(frames[1].dataUrl, 100, 100)).toBeLessThan(80) // sky painted (dark test colour)
    expect(px(frames[1].dataUrl, 100, 700)).toBeGreaterThan(200) // lake not yet
    expect(px(frames[2].dataUrl, 100, 700)).toBeLessThan(80)
  })
})
