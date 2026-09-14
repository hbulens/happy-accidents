import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'

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
    <section className="card p-5">
      <p className="eyebrow">Ask {instructorName}</p>
      <p className="mt-1 text-sm text-ink-soft">Type it, or just say it out loud with voice control on.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="My mountain highlight turned to mud, what now?"
          className="field min-w-0 flex-1 px-4 py-2.5 text-base"
          disabled={pending}
        />
        <button type="submit" className="btn-primary btn-primary-blue px-4" disabled={pending || !text.trim()} aria-label="Ask">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {pending && <p className="mt-3 text-sm text-ink-soft">{instructorName} is thinking…</p>}
      {error && <p className="mt-3 text-sm text-alizarin">{error}</p>}
      {answer && !pending && (
        <div className="mt-4 border-l-2 border-alizarin pl-4">
          {lastQuestion && <p className="text-xs text-ink-faint">You asked: “{lastQuestion}”</p>}
          <p className="font-display-text mt-1 text-lg leading-relaxed">{answer}</p>
        </div>
      )}
    </section>
  )
}
