// Anthropic SDK client, server-only. Lazy so the module can be imported at
// build time without the key present; any real call throws a clear error.
import Anthropic from '@anthropic-ai/sdk'

let cached: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (cached) return cached
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.',
    )
  }
  cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return cached
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop, receiver) {
    return Reflect.get(getAnthropic(), prop, receiver)
  },
})

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
