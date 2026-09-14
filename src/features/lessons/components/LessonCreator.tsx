import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dices, ImagePlus, Sparkles, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { randomSurprise } from '@/features/lessons/palette'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { encodeImageForUpload, makeThumbnail, type EncodedImage } from '@/features/lessons/utils/image'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { GenerationProgress } from '@/features/lessons/components/GenerationProgress'
import { useGenerationStore } from '@/features/lessons/stores/generation-store'
import { useImageStore } from '@/features/lessons/stores/image-store'
import { cn } from '@/lib/utils'

type Mode = 'imagine' | 'photo'

export function LessonCreator() {
  const navigate = useNavigate()
  const addLesson = useLessonStore((s) => s.addLesson)
  const generation = useGenerationStore()
  const [mode, setMode] = useState<Mode>('imagine')
  const [prompt, setPrompt] = useState('')
  const [note, setNote] = useState('')
  const [image, setImage] = useState<EncodedImage | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Hand over to the lesson page as soon as the finished picture is in, or as
  // soon as the text is done when no pictures are coming. Images keep
  // streaming in the background store.
  const firstImage = useImageStore((s) => (generation.lessonId ? s.images[generation.lessonId]?.['step-0'] : undefined))
  const ready = Boolean(generation.lessonId) && (Boolean(firstImage) || !generation.running || Boolean(generation.progress.imageError))
  const handedOff = useRef<string | null>(null)
  useEffect(() => {
    const id = generation.lessonId
    if (!ready || !id || handedOff.current === id) return
    handedOff.current = id
    void navigate({ to: '/lesson/$id', params: { id } })
  }, [ready, generation.lessonId, navigate])

  useEffect(() => {
    if (generation.error) {
      toast.error(generation.error)
      generation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation.error])

  async function pickFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('That is not an image.')
      return
    }
    try {
      setImage(await encodeImageForUpload(file))
      setMode('photo')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that image.')
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    void pickFile(e.dataTransfer.files[0])
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    void pickFile(e.target.files?.[0])
    e.target.value = ''
  }

  async function generate() {
    if (mode === 'photo' && !image) {
      toast.error('Add a photo first.')
      return
    }
    if (mode === 'photo' && image) {
      const thumbnail = await makeThumbnail(image.dataUrl)
      void generation.start(
        { mode: 'photo', note, image: { mediaType: image.mediaType, data: image.data } },
        { mode: 'photo', note, thumbnail },
      )
    } else {
      void generation.start({ mode: 'imagine', prompt }, { mode: 'imagine', prompt })
    }
  }

  function openDemo() {
    const lesson = addLesson(DEMO_LESSON, { mode: 'demo' })
    void navigate({ to: '/lesson/$id', params: { id: lesson.id } })
  }

  if (generation.running && !ready) return <GenerationProgress state={generation.progress} startedAt={generation.startedAt} />

  return (
    <div className="card card-tint p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Today's painting</p>
          <h2 className="font-display mt-1 text-3xl font-medium">Start with an idea or a photo</h2>
        </div>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'imagine'} className="tab" onClick={() => setMode('imagine')}>
            <Wand2 className="h-4 w-4" /> Imagine
          </button>
          <button type="button" role="tab" aria-selected={mode === 'photo'} className="tab" onClick={() => setMode('photo')}>
            <ImagePlus className="h-4 w-4" /> From a photo
          </button>
        </div>
      </div>

      {mode === 'imagine' ? (
        <div className="mt-6">
          <label htmlFor="prompt" className="text-sm font-semibold text-ink-soft">
            What would you like to paint?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="A little cabin by a mountain lake at sunset… or leave it blank and let the instructor dream one up."
            className="field font-display-text mt-2 w-full resize-none px-4 py-3 text-lg"
          />
          <button type="button" className="btn-ghost mt-2" onClick={() => setPrompt(randomSurprise())}>
            <Dices className="h-4 w-4" /> Surprise me
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInput.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition',
              dragging ? 'border-prussian bg-prussian-soft' : 'border-line bg-white/60 hover:bg-white',
            )}
          >
            {image ? (
              <div className="relative">
                <img src={image.dataUrl} alt="Your reference" className="max-h-72 rounded-xl object-contain shadow-[var(--shadow-lift)]" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImage(null)
                  }}
                  className="absolute -right-3 -top-3 rounded-full border border-line bg-paper p-1.5 shadow"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <ImagePlus className="h-9 w-9 text-ink-faint" />
                <p className="font-display-text mt-3 text-xl">Drop a photo here, or click to choose</p>
                <p className="mt-1 text-sm text-ink-faint">Landscapes work best. It is resized before upload.</p>
              </>
            )}
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to add? Make it winter, drop the parked cars…"
            className="field mt-4 w-full px-4 py-3 text-base"
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="button" className="btn-primary" onClick={generate}>
          <Sparkles className="h-5 w-5" /> Build my lesson
        </button>
        <button type="button" className="btn-secondary" onClick={openDemo}>
          Open the demo lesson
        </button>
        <p className="text-sm text-ink-faint">Takes two to three minutes. Get your Liquid White on meanwhile.</p>
      </div>
    </div>
  )
}
