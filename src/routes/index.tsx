import { createFileRoute } from '@tanstack/react-router'
import { LessonCreator } from '@/features/lessons/components/LessonCreator'
import { Painting } from '@/features/lessons/components/Painting'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { PaintSmear } from '@/components/PaintSmear'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-14">
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">Wet-on-wet oil painting, taught at your easel</p>
          <h1 className="font-display mt-4 text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
            Paint along,
            <br />
            step by step.
          </h1>
          <PaintSmear color="#8f2033" className="mt-5 h-8 w-56" />
          <p className="font-display-text mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            Describe a scene or hand over a photo. You get a complete lesson in the spirit of <em>The Joy of Painting</em>:
            the palette, the brushes, what to do with them, and a picture of the canvas after every step. Read aloud, driven by
            your voice, so your hands stay on the brush.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-ink-soft">
            <span className="chip">Liquid White base coat</span>
            <span className="chip">Knife mountains</span>
            <span className="chip">Fan-brush evergreens</span>
            <span className="chip">Hands-free</span>
          </div>
        </div>

        <figure className="mx-auto w-full max-w-lg lg:max-w-none">
          <div className="easel">
            <Painting src="/demo/final.webp" alt={DEMO_LESSON.title} className="aspect-[4/3]" />
          </div>
          <figcaption className="mt-4 flex items-baseline justify-between text-sm text-ink-soft">
            <span className="font-display-text text-base text-ink">{DEMO_LESSON.title}</span>
            <span>the demo lesson · {DEMO_LESSON.steps.length} steps</span>
          </figcaption>
        </figure>
      </section>

      <section className="mt-20">
        <LessonCreator />
      </section>

      <section className="mt-20 grid gap-5 sm:grid-cols-3">
        <Feature color="#1c3a5e" title="See every stage">
          A picture of what your canvas should look like after each step, painted from the finished piece.
        </Feature>
        <Feature color="#4a6b33" title="Real technique">
          Criss-cross skies, broken knife highlights, tap-and-lift mist, and the far-to-near order that makes it work.
        </Feature>
        <Feature color="#e9b331" title="Your photo, simplified">
          A snapshot becomes a paintable composition: three to five big shapes, a horizon, a matching palette.
        </Feature>
      </section>
    </main>
  )
}

function Feature({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  return (
    <div className="card p-6">
      <span className="swatch h-7 w-9" style={{ background: color }} />
      <h3 className="font-display mt-4 text-2xl font-medium leading-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  )
}
