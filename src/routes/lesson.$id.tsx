import { createFileRoute, Link } from '@tanstack/react-router'
import { LessonPlayer } from '@/features/lessons/components/LessonPlayer'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'

export const Route = createFileRoute('/lesson/$id')({
  component: LessonPage,
})

function LessonPage() {
  const { id } = Route.useParams()
  const lesson = useLessonStore((s) => s.lessons[id])
  if (!lesson) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-3xl">That lesson is not on this device.</h1>
        <p className="mt-2 text-ink-soft">Lessons are stored in your browser. Make a new one, or open the demo.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to the easel
        </Link>
      </main>
    )
  }
  return (
    <main>
      <LessonPlayer key={lesson.id} lesson={lesson} />
    </main>
  )
}
