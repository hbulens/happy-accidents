import { create } from 'zustand'
import { LessonSchema, type GenerateRequest, type LessonSource } from '@/features/lessons/schema'
import { readSse } from '@/features/lessons/utils/sse'
import { stepKey } from '@/features/lessons/utils/image-db'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { useImageStore } from '@/features/lessons/stores/image-store'

// Owns the long-running generation stream so it keeps running after the
// creator screen navigates away to the lesson.

export interface GenerationProgressState {
  phase: 'looking' | 'thinking' | 'writing' | 'painting'
  message: string
  title: string | null
  steps: string[]
  imagesDone: number
  imagesTotal: number
  imageError: string | null
}

interface GenerationState {
  running: boolean
  startedAt: number
  lessonId: string | null
  progress: GenerationProgressState
  error: string | null
  start: (req: GenerateRequest, source: LessonSource) => Promise<void>
  reset: () => void
}

const INITIAL: GenerationProgressState = {
  phase: 'thinking',
  message: 'Warming up the studio',
  title: null,
  steps: [],
  imagesDone: 0,
  imagesTotal: 0,
  imageError: null,
}

export const useGenerationStore = create<GenerationState>()((set, get) => ({
  running: false,
  startedAt: 0,
  lessonId: null,
  progress: INITIAL,
  error: null,
  reset: () => set({ running: false, lessonId: null, progress: INITIAL, error: null }),
  start: async (req, source) => {
    if (get().running) return
    set({
      running: true,
      startedAt: Date.now(),
      lessonId: null,
      error: null,
      progress: { ...INITIAL, phase: req.mode === 'photo' ? 'looking' : 'thinking' },
    })
    const patch = (p: Partial<GenerationProgressState>) => set((s) => ({ progress: { ...s.progress, ...p } }))
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(req),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Request failed (${res.status})`)
      }
      let lessonId: string | null = null
      for await (const ev of readSse(res)) {
        const data = JSON.parse(ev.data)
        switch (ev.event) {
          case 'progress':
            if (data.type === 'status') patch({ phase: data.phase, message: data.message })
            else if (data.type === 'title') patch({ title: data.title })
            else if (data.type === 'step') {
              const steps = [...get().progress.steps]
              steps[data.index] = data.title
              patch({ steps, message: `Writing step ${data.index + 1}` })
            }
            break
          case 'lesson': {
            const parsed = LessonSchema.safeParse(data)
            if (!parsed.success) throw new Error('The lesson came back in an unexpected shape.')
            const lesson = useLessonStore.getState().addLesson(parsed.data, source)
            lessonId = lesson.id
            set({ lessonId })
            patch({ imagesTotal: parsed.data.steps.length })
            break
          }
          case 'image':
            if (lessonId) {
              const key = data.kind === 'final' ? 'final' : stepKey(data.index)
              await useImageStore.getState().add(lessonId, key, data.dataUrl)
              patch({ imagesDone: get().progress.imagesDone + 1, message: data.kind === 'final' ? 'Painting each step' : get().progress.message })
            }
            break
          case 'image-error':
            patch({ imageError: data.error })
            break
          case 'error':
            throw new Error(data.message ?? 'Lesson generation failed.')
          case 'done':
            break
        }
      }
      if (!lessonId) throw new Error('The connection closed before the lesson was finished.')
      set({ running: false })
    } catch (e) {
      set({ running: false, error: e instanceof Error ? e.message : 'Something went wrong.' })
    }
  },
}))
