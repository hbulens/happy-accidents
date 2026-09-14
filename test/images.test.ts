import { describe, expect, it } from 'vitest'
import { STYLE_NOTE, layerPrompt, blankCanvas, CANVAS_W, CANVAS_H } from '@/features/lessons/server/images'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { firstUrl } from '@/lib/replicate'
import { composite, diffMask, cleanMask, polygonMask, createCanvas } from '@/lib/raster'

describe('replicate helpers', () => {
  it('normalises outputs to a single url', () => {
    expect(firstUrl('https://x/y.webp')).toBe('https://x/y.webp')
    expect(firstUrl(['https://x/a.webp', 'https://x/b.webp'])).toBe('https://x/a.webp')
    expect(() => firstUrl({})).toThrow()
  })
})

describe('layerPrompt', () => {
  it('asks to add only this step and keep the rest', () => {
    const p = layerPrompt(DEMO_LESSON, 3)
    expect(p).toContain(DEMO_LESSON.steps[3].paintsIn)
    expect(p).toContain(STYLE_NOTE)
    expect(p).toMatch(/Keep everything already on the canvas/)
    expect(p).not.toMatch(/\bno\b/i)
  })
})

describe('raster compositing', () => {
  it('only changed pixels come through the difference mask', () => {
    const w = 64
    const h = 48
    const before = createCanvas(w, h, '#f4efe3')
    const after = createCanvas(w, h, '#f4efe3')
    // paint a dark block in the middle of "after"
    for (let y = 10; y < 30; y++) for (let x = 20; x < 44; x++) {
      const i = (y * w + x) * 4
      after.data[i] = 40
      after.data[i + 1] = 50
      after.data[i + 2] = 80
    }
    const alpha = cleanMask(diffMask(before, after, null, 22, 70, 0), w, h)
    const out = composite(before, after, alpha)
    const centre = (20 * w + 32) * 4
    const corner = (2 * w + 2) * 4
    expect(out.data[centre]).toBeLessThan(60)
    expect(out.data[corner]).toBe(before.data[corner])
  })
  it('rasterises a polygon into the right area', () => {
    const m = polygonMask([[{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 75 }, { x: 0, y: 75 }]], 100, 75, 0)
    expect(m[10 * 100 + 10]).toBe(1)
    expect(m[10 * 100 + 80]).toBe(0)
  })
  it('makes a blank primed canvas of the right size', () => {
    const c = blankCanvas()
    expect(c.width).toBe(CANVAS_W)
    expect(c.height).toBe(CANVAS_H)
    expect(c.data[3]).toBe(255)
  })
})
