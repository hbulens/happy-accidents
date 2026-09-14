// Minimal Server-Sent Events reader over fetch (EventSource cannot POST).

export interface SseEvent {
  event: string
  data: string
}

export async function* readSse(response: Response): AsyncGenerator<SseEvent> {
  if (!response.body) return
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const parsed = parseChunk(chunk)
      if (parsed) yield parsed
    }
  }
}

export function parseChunk(chunk: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of chunk.split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  if (!data.length) return null
  return { event, data: data.join('\n') }
}
