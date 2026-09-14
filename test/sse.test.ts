import { describe, expect, it } from 'vitest'
import { parseChunk, readSse } from '@/features/lessons/utils/sse'

describe('parseChunk', () => {
  it('parses event and data lines and skips comments', () => {
    expect(parseChunk('event: progress\ndata: {"a":1}')).toEqual({ event: 'progress', data: '{"a":1}' })
    expect(parseChunk(': ping')).toBeNull()
    expect(parseChunk('data: x\ndata: y')).toEqual({ event: 'message', data: 'x\ny' })
  })
})

describe('readSse', () => {
  it('yields events across chunk boundaries', async () => {
    const parts = ['event: progress\ndata: 1\n\nevent: do', 'ne\ndata: {"ok":true}\n\n']
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const p of parts) c.enqueue(new TextEncoder().encode(p))
        c.close()
      },
    })
    const events = []
    for await (const e of readSse(new Response(body))) events.push(e)
    expect(events).toEqual([
      { event: 'progress', data: '1' },
      { event: 'done', data: '{"ok":true}' },
    ])
  })
})
