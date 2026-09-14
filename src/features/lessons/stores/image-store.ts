import { create } from 'zustand'
import { getImages, putImage, stepKey } from '@/features/lessons/utils/image-db'
import type { Lesson } from '@/features/lessons/schema'

// In-memory cache of lesson pictures, hydrated from IndexedDB on demand.
// Demo lessons use static files under /demo instead.

interface ImageState {
  images: Record<string, Record<string, string>>
  loaded: Record<string, boolean>
  load: (lessonId: string) => Promise<void>
  add: (lessonId: string, key: string, dataUrl: string, persist?: boolean) => Promise<void>
}

export const useImageStore = create<ImageState>()((set, get) => ({
  images: {},
  loaded: {},
  load: async (lessonId) => {
    if (get().loaded[lessonId]) return
    let found: Record<string, string> = {}
    try {
      found = await getImages(lessonId)
    } catch {
      found = {}
    }
    set((s) => ({
      images: { ...s.images, [lessonId]: { ...found, ...(s.images[lessonId] ?? {}) } },
      loaded: { ...s.loaded, [lessonId]: true },
    }))
  },
  add: async (lessonId, key, dataUrl, persist = true) => {
    set((s) => ({ images: { ...s.images, [lessonId]: { ...(s.images[lessonId] ?? {}), [key]: dataUrl } } }))
    if (persist) {
      try {
        await putImage(lessonId, key, dataUrl)
      } catch (e) {
        console.warn('[images] could not persist', e)
      }
    }
  },
}))

/** Resolve the picture for a step (or the finished painting) if we have it. */
export function useLessonImage(lesson: Lesson, key: 'final' | number): string | null {
  const images = useImageStore((s) => s.images[lesson.id])
  if (lesson.source.mode === 'demo') {
    return key === 'final' ? '/demo/final.jpg' : `/demo/${stepKey(key)}.jpg`
  }
  if (!images) return null
  if (key === 'final') return images.final ?? null
  if (key === lesson.steps.length - 1) return images.final ?? null
  return images[stepKey(key)] ?? null
}
