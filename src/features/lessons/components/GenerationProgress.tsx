import { useEffect, useState } from 'react'
import { WAITING_QUOTES } from '@/features/lessons/palette'
import type { GenerationProgressState } from '@/features/lessons/stores/generation-store'
import { PaintSmear } from '@/components/PaintSmear'

const SMEAR_COLORS = ['#1c3a5e', '#8f2033', '#e9b331', '#4a6b33', '#9a4f2a']

const PHASE_LABEL: Record<GenerationProgressState['phase'], string> = {
  looking: 'Looking at your photo',
  thinking: 'Composing',
  writing: 'Writing the lesson',
  painting: 'At the easel',
}

export function GenerationProgress({ state, startedAt }: { state: GenerationProgressState; startedAt: number }) {
  const [now, setNow] = useState(Date.now())
  const [q, setQ] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    const u = setInterval(() => setQ((n) => (n + 1) % WAITING_QUOTES.length), 6000)
    return () => {
      clearInterval(t)
      clearInterval(u)
    }
  }, [])
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000))
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="card card-tint grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="eyebrow">{PHASE_LABEL[state.phase]}</p>
        <h2 className="font-display mt-3 text-4xl font-medium leading-tight">{state.title ?? `${state.message}…`}</h2>
        {state.title && <p className="mt-2 text-ink-soft">{state.message}…</p>}
        <PaintSmear color={SMEAR_COLORS[state.steps.length % SMEAR_COLORS.length]} className="mt-6 h-9 w-full max-w-sm" animate />
        <p className="font-display-text mt-8 text-lg text-ink-soft">“{WAITING_QUOTES[q]}”</p>
        <p className="mt-8 text-sm tabular-nums text-ink-faint">
          {mm}:{ss} elapsed · the text takes two to three minutes, then the finished picture is painted
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white/60 p-5">
        <p className="eyebrow">Steps so far</p>
        {state.steps.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            {state.phase === 'writing' ? 'Laying out the palette and the tools…' : 'Deciding where the horizon goes…'}
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {state.steps.map((title, i) => (
              <li key={i} className="animate-rise flex items-baseline gap-3">
                <span className="font-display w-7 shrink-0 text-right text-lg text-alizarin">{i + 1}</span>
                <span className="font-display-text text-lg">{title}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
