import { AlertTriangle, Clock, Sparkles } from 'lucide-react'
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
    <article className="card p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">
            Step {index + 1} of {total} · {step.phase}
          </p>
          <h2 className="font-display mt-2 text-3xl font-medium leading-tight sm:text-4xl">{step.title}</h2>
        </div>
        <span className="chip">
          <Clock className="h-3 w-3" /> about {step.minutes} min
        </span>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="chip chip-blue">{step.tool}</span>
        {step.colors.map((c) => (
          <span key={c} className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
            <span className="swatch h-5 w-7" style={{ background: paletteHex[c.toLowerCase()] ?? resolveHex(c, '#999') }} />
            {c}
          </span>
        ))}
      </div>

      <p className="font-display-text mt-6 text-xl leading-relaxed sm:text-[1.3rem]">{step.instruction}</p>

      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white/70 p-4">
          <dt className="eyebrow">Technique</dt>
          <dd className="mt-1 text-ink">{step.technique}</dd>
        </div>
        <div className="rounded-xl bg-white/70 p-4">
          <dt className="eyebrow">Loading the brush</dt>
          <dd className="mt-1 text-ink">{step.brushLoading}</dd>
        </div>
      </dl>

      <ul className="mt-5 space-y-2 text-sm">
        {step.tips.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cadmium" />
            <span>{tip}</span>
          </li>
        ))}
        <li className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alizarin" />
          <span>
            <span className="font-semibold">Watch out: </span>
            {step.watchOut}
          </span>
        </li>
      </ul>

      {step.happyAccident && (
        <div className="mt-5 flex gap-3 rounded-xl border border-cadmium/40 bg-cadmium-soft/60 p-4 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
          <p>
            <span className="font-semibold">Happy accident: </span>
            {step.happyAccident}
          </p>
        </div>
      )}
    </article>
  )
}
