import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Dices, ImagePlus, Sparkles, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { LessonSchema, type LessonContent } from '@/features/lessons/schema'
import { randomSurprise, WAITING_QUOTES } from '@/features/lessons/palette'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { encodeImageForUpload, makeThumbnail, type EncodedImage } from '@/features/lessons/utils/image'
import { DEMO_LESSON } from '@/features/lessons/data/demo-lesson'
import { cn } from '@/lib/utils'

type Mode = 'imagine' | 'photo'

export function LessonCreator() {
  const navigate = useNavigate()
  const addLesson = useLessonStore((s) => s.addLesson)
  const [mode, setMode] = useState<Mode>('imagine')
  const [prompt, setPrompt] = useState('')
  const [note, setNote] = useState('')
  const [image, setImage] = useState<EncodedImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

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
    setBusy(true)
    try {
      const body =
        mode === 'photo' && image
          ? { mode: 'photo', note, image: { mediaType: image.mediaType, data: image.data } }
          : { mode: 'imagine', prompt }
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
      const parsed = LessonSchema.safeParse(json)
      if (!parsed.success) throw new Error('The lesson came back in an unexpected shape.')
      const lesson = addLesson(
        parsed.data,
        mode === 'photo' && image
          ? { mode: 'photo', note, thumbnail: await makeThumbnail(image.dataUrl) }
          : { mode: 'imagine', prompt },
      )
      void navigate({ to: '/lesson/$id', params: { id: lesson.id } })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  function openDemo() {
    const lesson = addLesson(DEMO_LESSON as LessonContent, { mode: 'demo' })
    void navigate({ to: '/lesson/$id', params: { id: lesson.id } })
  }

  if (busy) return <WaitingScreen mode={mode} />

  return (
    <div className="card p-5 sm:p-8">
      <div className="flex gap-1 rounded-full bg-canvas-deep p-1 text-sm">
        <ModeTab active={mode === 'imagine'} onClick={() => setMode('imagine')}>
          <Wand2 className="h-4 w-4" /> Imagine a painting
        </ModeTab>
        <ModeTab active={mode === 'photo'} onClick={() => setMode('photo')}>
          <ImagePlus className="h-4 w-4" /> Paint from a photo
        </ModeTab>
      </div>

      {mode === 'imagine' ? (
        <div className="mt-5">
          <label htmlFor="prompt" className="text-sm font-medium">
            What would you like to paint today?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="A little cabin by a mountain lake at sunset… or leave it blank and let the instructor dream one up."
            className="mt-2 w-full resize-none rounded-2xl border border-canvas-deep bg-white p-4 text-base outline-none focus:border-phthalo"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => setPrompt(randomSurprise())}>
              <Dices className="h-4 w-4" /> Surprise me
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
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
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition',
              dragging ? 'border-phthalo bg-phthalo-soft' : 'border-canvas-deep bg-white/60 hover:bg-white',
            )}
          >
            {image ? (
              <div className="relative">
                <img src={image.dataUrl} alt="Your reference" className="max-h-64 rounded-xl object-contain shadow" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImage(null)
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-ink-soft" />
                <p className="mt-2 text-sm font-medium">Drop a photo here, or click to choose</p>
                <p className="text-xs text-ink-soft">Landscapes work best. It is resized before upload.</p>
              </>
            )}
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to add? e.g. make it a winter scene, drop the parked cars"
            className="mt-3 w-full rounded-full border border-canvas-deep bg-white px-4 py-2 text-sm outline-none focus:border-phthalo"
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={generate}>
          <Sparkles className="h-4 w-4" /> Build my lesson
        </button>
        <button type="button" className="btn-secondary" onClick={openDemo}>
          Try the demo lesson
        </button>
        <p className="text-xs text-ink-soft">Lessons take a minute or two to compose. Get your Liquid White on meanwhile.</p>
      </div>
    </div>
  )
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2', active && 'bg-white shadow')}
    >
      {children}
    </button>
  )
}

function WaitingScreen({ mode }: { mode: Mode }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % WAITING_QUOTES.length), 4500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="card flex flex-col items-center p-10 text-center">
      <div className="animate-brush text-5xl" aria-hidden>
        🖌️
      </div>
      <h2 className="font-display mt-4 text-2xl">
        {mode === 'photo' ? 'Studying your photo and sketching the lesson…' : 'Dreaming up your painting…'}
      </h2>
      <p className="mt-3 max-w-md text-ink-soft transition-opacity">“{WAITING_QUOTES[i]}”</p>
      <p className="mt-6 text-xs text-ink-soft">This usually takes one to three minutes.</p>
    </div>
  )
}
