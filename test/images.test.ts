import { describe, expect, it } from 'vitest'
import { STYLE_PROMPT } from '@/features/lessons/server/images'
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
