// Pure parser for spoken commands. Kept free of browser APIs so it is easy to
// test. Recognition transcripts arrive lowercase-ish without punctuation.

export type VoiceCommand =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'repeat' }
  | { type: 'tips' }
  | { type: 'stop' }
  | { type: 'palette' }
  | { type: 'tools' }
  | { type: 'finished' }
  | { type: 'goto'; step: number }
  | { type: 'ask'; question: string }
  | { type: 'ignore' }

const WAKE_WORDS = ['hey bob', 'okay bob', 'ok bob', 'bob', 'hey instructor', 'instructor', 'question']

const QUESTION_STARTS = [
  'how', 'what', 'why', 'where', 'which', 'when', 'can', 'could', 'should', 'do', 'does', 'is', 'are',
  'am', 'i messed', 'i made', 'i ruined', 'my', 'help', 'it looks', 'it went', 'oops', 'something',
]

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
}

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripWakeWord(s: string): { text: string; woke: boolean } {
  for (const w of WAKE_WORDS) {
    if (s === w) return { text: '', woke: true }
    if (s.startsWith(w + ' ')) return { text: s.slice(w.length + 1).trim(), woke: true }
  }
  return { text: s, woke: false }
}

function matches(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text === p || text.startsWith(p + ' ') || text.endsWith(' ' + p))
}

export function parseCommand(transcript: string): VoiceCommand {
  const raw = clean(transcript)
  if (!raw) return { type: 'ignore' }
  const { text, woke } = stripWakeWord(raw)
  if (!text) return { type: 'ignore' }

  if (matches(text, ['next', 'next step', 'go on', 'continue', 'move on', 'done', 'okay next', 'ok next', 'and next']))
    return { type: 'next' }
  if (matches(text, ['back', 'go back', 'previous', 'previous step', 'last step', 'step back']))
    return { type: 'back' }
  if (matches(text, ['repeat', 'again', 'say that again', 'say again', 'read again', 'read that again', 'one more time', 'read the step', 'read step']))
    return { type: 'repeat' }
  if (matches(text, ['tips', 'any tips', 'give me a tip', 'give me tips', 'what should i watch out for', 'watch out']))
    return { type: 'tips' }
  if (matches(text, ['stop', 'stop talking', 'quiet', 'be quiet', 'hush', 'pause', 'shush']))
    return { type: 'stop' }
  if (matches(text, ['palette', 'show palette', 'show the palette', 'show colors', 'show colours', 'what colors', 'what colours', 'which colors', 'which colours']))
    return { type: 'palette' }
  if (matches(text, ['tools', 'show tools', 'show the tools', 'brushes', 'what brush', 'which brush', 'what tool', 'which tool']))
    return { type: 'tools' }
  if (matches(text, ['show finished', 'show the finished painting', 'finished painting', 'show painting', 'show the painting', 'show the whole painting', 'final painting']))
    return { type: 'finished' }

  const goto = text.match(/^(?:go to|jump to|skip to|goto) step (\w+)$/)
  if (goto) {
    const n = NUMBER_WORDS[goto[1]] ?? parseInt(goto[1], 10)
    if (Number.isFinite(n) && n > 0) return { type: 'goto', step: n }
  }

  const words = text.split(' ')
  const looksLikeQuestion = QUESTION_STARTS.some((q) => text === q || text.startsWith(q + ' '))
  if (woke && words.length >= 2) return { type: 'ask', question: text }
  if (looksLikeQuestion && words.length >= 4) return { type: 'ask', question: text }

  return { type: 'ignore' }
}
