import { useState, type FormEvent } from 'react'
import { MessageCircleQuestion, Send } from 'lucide-react'

interface Props {
  instructorName: string
  pending: boolean
  answer: string | null
  error: string | null
  lastQuestion: string | null
  onAsk: (question: string) => void
}

export function AskInstructor({ instructorName, pending, answer, error, lastQuestion, onAsk }: Props) {
  const [text, setText] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || pending) return
    onAsk(text.trim())
    setText('')
  }

  return (
    <section className="card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircleQuestion className="h-4 w-4 text-phthalo" /> Ask {instructorName}
      </h3>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="My mountain highlight turned to mud, what now?"
          className="min-w-0 flex-1 rounded-full border border-canvas-deep bg-white px-4 py-2 text-sm outline-none focus:border-phthalo"
          disabled={pending}
        />
        <button type="submit" className="btn-primary px-4" disabled={pending || !text.trim()} aria-label="Ask">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {pending && <p className="mt-3 text-sm text-ink-soft">{instructorName} is thinking…</p>}
      {error && <p className="mt-3 text-sm text-crimson">{error}</p>}
      {answer && !pending && (
        <div className="mt-3 rounded-xl bg-phthalo-soft p-3 text-sm">
          {lastQuestion && <p className="mb-1 text-xs text-ink-soft">You asked: "{lastQuestion}"</p>}
          <p>{answer}</p>
        </div>
      )}
    </section>
  )
}
