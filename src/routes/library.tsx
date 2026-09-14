import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { useEffect } from 'react'
import { Painting } from '@/features/lessons/components/Painting'
import { useImageStore, useLessonImage } from '@/features/lessons/stores/image-store'
import { deleteImages } from '@/features/lessons/utils/image-db'
import type { Lesson } from '@/features/lessons/schema'

export const Route = createFileRoute('/library')({
  component: LibraryPage,
})

function LibraryPage() {
  const lessons = useLessonStore((s) => s.lessons)
  const progress = useLessonStore((s) => s.progress)
  const removeLesson = useLessonStore((s) => s.removeLesson)
  const list = Object.values(lessons).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <p className="eyebrow">Your wall</p>
      <h1 className="font-display mt-2 text-4xl font-medium">My paintings</h1>
      <p className="mt-1 text-sm text-ink-soft">Stored in this browser.</p>
      {list.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-display-text text-lg text-ink-soft">Nothing on the wall yet.</p>
          <Link to="/" className="btn-primary mt-5 inline-flex">
            Start a painting
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((lesson) => {
            const step = progress[lesson.id] ?? 0
            const done = step >= lesson.steps.length - 1
            const minutes = lesson.steps.reduce((n, s) => n + s.minutes, 0) || lesson.totalMinutes
            return (
              <li key={lesson.id}>
                <Link to="/lesson/$id" params={{ id: lesson.id }} className="block">
                  <div className="easel">
                    <Thumb lesson={lesson} />
                  </div>
                </Link>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-medium leading-tight">{lesson.title}</h2>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {lesson.source.mode === 'photo' ? 'From a photo' : lesson.source.mode === 'demo' ? 'Demo' : 'Imagined'} · {minutes} min ·{' '}
                      {done ? 'finished' : `step ${step + 1} of ${lesson.steps.length}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove "${lesson.title}" from this device?`)) {
                        removeLesson(lesson.id)
                        void deleteImages(lesson.id).catch(() => {})
                      }
                    }}
                    className="btn-ghost"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
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

function Thumb({ lesson }: { lesson: Lesson }) {
  const load = useImageStore((s) => s.load)
  useEffect(() => {
    void load(lesson.id)
  }, [lesson.id, load])
  const src = useLessonImage(lesson, 'final')
  return <Painting src={src} alt={lesson.title} className="aspect-[4/3]" />
}
