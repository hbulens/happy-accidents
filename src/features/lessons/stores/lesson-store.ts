import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lesson, LessonContent, LessonSource } from '@/features/lessons/schema'
import { newId } from '@/lib/utils'

interface Settings {
  autoRead: boolean
  voiceControl: boolean
  speechRate: number
  instructorName: string
}

interface LessonState {
  lessons: Record<string, Lesson>
  progress: Record<string, number>
  settings: Settings
  addLesson: (content: LessonContent, source: LessonSource) => Lesson
  removeLesson: (id: string) => void
  setStep: (id: string, step: number) => void
  updateSettings: (patch: Partial<Settings>) => void
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set) => ({
      lessons: {},
      progress: {},
      settings: { autoRead: true, voiceControl: false, speechRate: 0.92, instructorName: 'Bob' },
      addLesson: (content, source) => {
        const lesson: Lesson = { ...content, id: newId(), createdAt: new Date().toISOString(), source }
        set((s) => ({ lessons: { ...s.lessons, [lesson.id]: lesson }, progress: { ...s.progress, [lesson.id]: 0 } }))
        return lesson
      },
      removeLesson: (id) =>
        set((s) => {
          const lessons = { ...s.lessons }
          const progress = { ...s.progress }
          delete lessons[id]
          delete progress[id]
          return { lessons, progress }
        }),
      setStep: (id, step) => set((s) => ({ progress: { ...s.progress, [id]: step } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'happy-accidents/v1' },
  ),
)
