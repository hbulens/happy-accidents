import { createFileRoute } from '@tanstack/react-router'
import { LessonCreator } from '@/features/lessons/components/LessonCreator'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <section className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sienna">The joy of wet-on-wet</p>
        <h1 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">
          Your own painting lesson, read aloud at the easel.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Describe a scene or upload a photo. You get a step-by-step oil painting lesson in the gentle spirit of
          The Joy of Painting: which brush, which colors, which stroke, and a growing sketch of the canvas. Turn on
          voice control and keep your hands on the brush.
        </p>
      </section>
      <LessonCreator />
      <section className="mt-10 grid gap-4 text-sm sm:grid-cols-3">
        <Feature title="Hands-free" body='Say "next", "repeat", "tips" or ask "Bob, my sky went muddy, what now?"' />
        <Feature title="Real technique" body="Liquid White, criss-cross skies, knife mountains, fan-brush evergreens." />
        <Feature title="Your photo, simplified" body="A snapshot becomes a paintable composition with a matching palette." />
      </section>
    </main>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-4">
      <h3 className="font-display text-lg">{title}</h3>
      <p className="mt-1 text-ink-soft">{body}</p>
    </div>
  )
}
