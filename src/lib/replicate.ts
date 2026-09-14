// Minimal Replicate client over fetch. Server-only.
// Creates a prediction on an official model, waits synchronously when the
// API allows it, and polls otherwise.

const API = 'https://api.replicate.com/v1'

export class ReplicateError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

function token(): string {
  const t = process.env.REPLICATE_API_TOKEN
  if (!t) throw new ReplicateError('REPLICATE_API_TOKEN is not set. Add it to .env.', 503)
  return t
}

export function hasReplicateToken(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

interface Prediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: unknown
  error?: string | null
  urls: { get: string; cancel: string }
}

/** Run an official model (owner/name) and return its output. */
export async function runModel(model: string, input: Record<string, unknown>, timeoutMs = 180_000): Promise<unknown> {
  const res = await fetch(`${API}/models/${model}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ReplicateError(`Replicate ${model} returned ${res.status}: ${text.slice(0, 300)}`, res.status === 401 ? 500 : 502)
  }
  let prediction = (await res.json()) as Prediction
  const deadline = Date.now() + timeoutMs
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    if (Date.now() > deadline) throw new ReplicateError(`Replicate ${model} timed out`, 504)
    await new Promise((r) => setTimeout(r, 1500))
    const poll = await fetch(prediction.urls.get, { headers: { Authorization: `Bearer ${token()}` } })
    if (!poll.ok) throw new ReplicateError(`Replicate poll failed (${poll.status})`, 502)
    prediction = (await poll.json()) as Prediction
  }
  if (prediction.status !== 'succeeded') {
    throw new ReplicateError(`Replicate ${model} ${prediction.status}: ${prediction.error ?? 'no details'}`, 502)
  }
  return prediction.output
}

/** Normalise a model's output to a single URL. */
export function firstUrl(output: unknown): string {
  if (typeof output === 'string') return output
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0]
  throw new ReplicateError('Replicate returned no image URL', 502)
}

/** Download an image and return it as a data URL. */
export async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new ReplicateError(`Could not download image (${res.status})`, 502)
  const type = res.headers.get('content-type') ?? 'image/webp'
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:${type};base64,${buf.toString('base64')}`
}
