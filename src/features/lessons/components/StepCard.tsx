import { AlertTriangle, Clock, Lightbulb, Sparkles } from 'lucide-react'
import type { Step } from '@/features/lessons/schema'
import { resolveHex } from '@/features/lessons/palette'

interface Props {
  step: Step
  index: number
  total: number
  paletteHex: Record<string, string>
}

export function StepCard({ step, index, total, paletteHex }: Props) {
  return (
    <article className="card p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sienna">
            Step {index + 1} of {total} · {step.phase}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight sm:text-3xl">{step.title}</h2>
        </div>
        <span className="chip">
          <Clock className="h-3 w-3" /> ~{step.minutes} min
        </span>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-phthalo-soft px-3 py-1 text-sm font-medium text-phthalo">{step.tool}</span>
        {step.colors.map((c) => (
          <span key={c} className="chip bg-white">
            <span
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ background: paletteHex[c.toLowerCase()] ?? resolveHex(c, '#999') }}
            />
            {c}
          </span>
        ))}
      </div>

      <p className="mt-5 text-lg leading-relaxed text-ink">{step.instruction}</p>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white/60 p-3">
          <dt className="font-semibold">Technique</dt>
          <dd className="text-ink-soft">{step.technique}</dd>
        </div>
        <div className="rounded-xl bg-white/60 p-3">
          <dt className="font-semibold">Loading the brush</dt>
          <dd className="text-ink-soft">{step.brushLoading}</dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2 text-sm">
        {step.tips.map((tip) => (
          <li key={tip} className="flex gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>{tip}</span>
          </li>
        ))}
        <li className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson" />
          <span>
            <span className="font-medium">Watch out: </span>
            {step.watchOut}
          </span>
        </li>
        {step.happyAccident && (
          <li className="flex gap-2 rounded-xl bg-gold/10 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              <span className="font-medium">Happy accident: </span>
              {step.happyAccident}
            </span>
          </li>
        )}
      </ul>
    </article>
  )
}
