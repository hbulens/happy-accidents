import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { CanvasPreview } from '@/features/lessons/components/CanvasPreview'
import { totalMinutes } from '@/features/lessons/utils/layers'

export const Route = createFileRoute('/library')({
  component: LibraryPage,
})

function LibraryPage() {
  const lessons = useLessonStore((s) => s.lessons)
  const progress = useLessonStore((s) => s.progress)
  const removeLesson = useLessonStore((s) => s.removeLesson)
  const list = Object.values(lessons).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="font-display text-3xl">My paintings</h1>
      <p className="mt-1 text-sm text-ink-soft">Stored in this browser only.</p>
      {list.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-ink-soft">Nothing on the wall yet.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">
            Start a painting
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((lesson) => {
            const step = progress[lesson.id] ?? 0
            const done = step >= lesson.steps.length - 1
            return (
              <li key={lesson.id} className="card overflow-hidden">
                <Link to="/lesson/$id" params={{ id: lesson.id }} className="block">
                  <CanvasPreview steps={lesson.steps} throughStep={lesson.steps.length - 1} className="rounded-none" />
                  <div className="p-4">
                    <h2 className="font-display text-xl">{lesson.title}</h2>
                    <p className="mt-1 text-xs text-ink-soft">
                      {lesson.source.mode === 'photo' ? 'From a photo' : lesson.source.mode === 'demo' ? 'Demo' : 'Imagined'} ·{' '}
                      {totalMinutes(lesson)} min · {done ? 'finished' : `step ${step + 1} of ${lesson.steps.length}`}
                    </p>
                  </div>
                </Link>
                <div className="flex justify-end border-t border-canvas-deep px-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove "${lesson.title}" from this device?`)) removeLesson(lesson.id)
                    }}
                    className="btn-ghost text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
