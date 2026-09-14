import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronLeft, ChevronRight, Palette, RotateCcw, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import type { Lesson } from '@/features/lessons/schema'
import { resolveHex } from '@/features/lessons/palette'
import { useLessonStore } from '@/features/lessons/stores/lesson-store'
import { useSpeech } from '@/features/lessons/hooks/useSpeech'
import { useVoiceCommands } from '@/features/lessons/hooks/useVoiceCommands'
import type { VoiceCommand } from '@/features/lessons/utils/commands'
import { Painting } from '@/features/lessons/components/Painting'
import { useGenerationStore } from '@/features/lessons/stores/generation-store'
import { useImageStore, useLessonImage } from '@/features/lessons/stores/image-store'
import { StepCard } from '@/features/lessons/components/StepCard'
import { PalettePanel } from '@/features/lessons/components/PalettePanel'
import { ToolsPanel } from '@/features/lessons/components/ToolsPanel'
import { VoiceBar } from '@/features/lessons/components/VoiceBar'
import { AskInstructor } from '@/features/lessons/components/AskInstructor'
import { cn } from '@/lib/utils'

interface Props {
  lesson: Lesson
}

type Panel = 'step' | 'palette' | 'tools'
type View = 'step' | 'finished' | 'reference'

export function LessonPlayer({ lesson }: Props) {
  const savedStep = useLessonStore((s) => s.progress[lesson.id] ?? 0)
  const setStep = useLessonStore((s) => s.setStep)
  const settings = useLessonStore((s) => s.settings)
  const updateSettings = useLessonStore((s) => s.updateSettings)

  const total = lesson.steps.length
  const stepIndex = Math.min(Math.max(savedStep, 0), total - 1)
  const step = lesson.steps[stepIndex]

  const [panel, setPanel] = useState<Panel>('step')
  const [view, setView] = useState<View>('step')
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [askError, setAskError] = useState<string | null>(null)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)
  const loadImages = useImageStore((s) => s.load)
  useEffect(() => {
    void loadImages(lesson.id)
  }, [lesson.id, loadImages])
  const stepImage = useLessonImage(lesson, stepIndex)
  const finalImage = useLessonImage(lesson, 'final')
  const generating = useGenerationStore((s) => s.running && s.lessonId === lesson.id)
  const imageError = useGenerationStore((s) => (s.lessonId === lesson.id ? s.progress.imageError : null))

  const { speak, cancel, speaking, supported: ttsSupported } = useSpeech(settings.speechRate)

  const paletteHex = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of lesson.palette) map[c.name.toLowerCase()] = resolveHex(c.name, c.hex)
    return map
  }, [lesson.palette])

  const readStep = useCallback(
    (index: number) => {
      const s = lesson.steps[index]
      if (!s) return
      speak(`Step ${index + 1}. ${s.title}. ${s.instruction}`)
    },
    [lesson.steps, speak],
  )

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), total - 1)
      setStep(lesson.id, clamped)
      setPanel('step')
      setView('step')
      if (settings.autoRead) readStep(clamped)
    },
    [lesson.id, total, setStep, settings.autoRead, readStep],
  )

  // Read the intro once when a lesson is opened fresh at step 0.
  const introRead = useRef(false)
  useEffect(() => {
    if (introRead.current || !settings.autoRead || stepIndex !== 0) return
    introRead.current = true
    const t = setTimeout(() => speak(`${lesson.intro} Step 1. ${step.title}. ${step.instruction}`), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ask = useCallback(
    async (question: string) => {
      setAsking(true)
      setAskError(null)
      setLastQuestion(question)
      setAnswer(null)
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            lesson: { title: lesson.title, sceneDescription: lesson.sceneDescription, palette: lesson.palette.map((c) => c.name) },
            step: { index: stepIndex, title: step.title, tool: step.tool, colors: step.colors, instruction: step.instruction },
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
        setAnswer(body.answer)
        speak(body.answer)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong.'
        setAskError(msg)
        speak("Sorry, I couldn't hear that one through. Try again.")
      } finally {
        setAsking(false)
      }
    },
    [lesson, step, stepIndex, speak],
  )

  const handleCommand = useCallback(
    (cmd: VoiceCommand) => {
      switch (cmd.type) {
        case 'next':
          if (stepIndex >= total - 1) speak("That's the last step. You're all done, friend.")
          else goTo(stepIndex + 1)
          break
        case 'back':
          if (stepIndex === 0) speak('We are at the very first step.')
          else goTo(stepIndex - 1)
          break
        case 'repeat':
          readStep(stepIndex)
          break
        case 'tips':
          speak(`${step.tips.join(' ')} Watch out: ${step.watchOut}${step.happyAccident ? ` And if it goes sideways: ${step.happyAccident}` : ''}`)
          break
        case 'stop':
          cancel()
          break
        case 'palette':
          setPanel('palette')
          speak(`For this step you need ${step.colors.join(', ')}.`)
          break
        case 'tools':
          setPanel('tools')
          speak(`Use your ${step.tool}.`)
          break
        case 'finished':
          setView('finished')
          speak('Here is the finished painting.')
          break
        case 'goto':
          if (cmd.step >= 1 && cmd.step <= total) goTo(cmd.step - 1)
          else speak(`There are only ${total} steps.`)
          break
        case 'ask':
          toast(`Asking: "${cmd.question}"`)
          void ask(cmd.question)
          break
        default:
          break
      }
    },
    [stepIndex, total, goTo, readStep, speak, cancel, step, ask],
  )

  const voice = useVoiceCommands({
    enabled: settings.voiceControl,
    hold: speaking || asking,
    onCommand: handleCommand,
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') goTo(stepIndex + 1)
      if (e.key === 'ArrowLeft') goTo(stepIndex - 1)
      if (e.key === ' ') {
        e.preventDefault()
        if (speaking) cancel()
        else readStep(stepIndex)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, stepIndex, speaking, cancel, readStep])

  const minutes = lesson.steps.reduce((n, s) => n + s.minutes, 0) || lesson.totalMinutes

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/library" className="btn-ghost" aria-label="Back to my paintings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-medium leading-tight sm:text-3xl">{lesson.title}</h1>
            <p className="text-xs text-ink-soft">
              {lesson.mood} · {lesson.difficulty} · about {minutes} minutes · {lesson.canvas}
            </p>
          </div>
        </div>
        <p className="font-display text-xl">
          <span className="text-alizarin">{stepIndex + 1}</span>
          <span className="text-ink-faint"> / {total}</span>
        </p>
      </header>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-linen-deep" aria-hidden>
        <div className="h-full rounded-full bg-alizarin transition-all" style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
      </div>

      <div className="mt-4">
        <VoiceBar
          status={voice.status}
          lastHeard={voice.lastHeard}
          enabled={settings.voiceControl}
          onToggle={() => updateSettings({ voiceControl: !settings.voiceControl })}
          autoRead={settings.autoRead}
          onToggleAutoRead={() => updateSettings({ autoRead: !settings.autoRead })}
          speaking={speaking}
          onStopSpeaking={cancel}
        />
        {!ttsSupported && <p className="mt-2 text-xs text-alizarin">This browser cannot read aloud. Try Chrome, Edge or Safari.</p>}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,11fr)_minmax(0,10fr)]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={view === 'step'} className="tab" onClick={() => setView('step')}>
                After this step
              </button>
              <button type="button" role="tab" aria-selected={view === 'finished'} className="tab" onClick={() => setView('finished')}>
                Finished painting
              </button>
              {lesson.source.mode === 'photo' && lesson.source.thumbnail && (
                <button type="button" role="tab" aria-selected={view === 'reference'} className="tab" onClick={() => setView('reference')}>
                  Your photo
                </button>
              )}
            </div>
            {generating && <span className="chip">painting the pictures…</span>}
          </div>

          <div className="easel">
            {view === 'reference' && lesson.source.mode === 'photo' ? (
              <Painting src={lesson.source.thumbnail} alt="Reference photo" className="aspect-[4/3]" />
            ) : view === 'finished' ? (
              <Painting src={finalImage} alt="The finished painting" pending={generating} note={imageError ?? undefined} className="aspect-[4/3]" />
            ) : (
              <Painting
                src={stepImage}
                alt={`The canvas after step ${stepIndex + 1}`}
                pending={generating}
                note={imageError ?? (generating ? 'Painting up to this step…' : undefined)}
                className="aspect-[4/3]"
              />
            )}
          </div>

          <div className="card mt-4 p-4">
            {view === 'finished' ? (
              <p className="font-display-text text-lg leading-relaxed text-ink-soft">{lesson.sceneDescription}</p>
            ) : view === 'reference' ? (
              <p className="text-sm text-ink-soft">{lesson.adaptationNotes ?? 'The lesson simplifies this photo into big paintable shapes.'}</p>
            ) : (
              <>
                <p className="eyebrow">Your canvas should look like this now</p>
                <p className="font-display-text mt-1 text-lg leading-relaxed">{step.canvasAfter}</p>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0} className="btn-secondary">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" onClick={() => readStep(stepIndex)} className="btn-ghost" title="Read this step again (space)">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Read again</span>
            </button>
            <button type="button" onClick={() => goTo(stepIndex + 1)} disabled={stepIndex >= total - 1} className="btn-primary">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="tabs w-full" role="tablist">
            <PanelTab active={panel === 'step'} onClick={() => setPanel('step')}>
              This step
            </PanelTab>
            <PanelTab active={panel === 'palette'} onClick={() => setPanel('palette')}>
              <Palette className="h-4 w-4" /> Palette
            </PanelTab>
            <PanelTab active={panel === 'tools'} onClick={() => setPanel('tools')}>
              <Wrench className="h-4 w-4" /> Tools
            </PanelTab>
          </div>

          {panel === 'step' && <StepCard step={step} index={stepIndex} total={total} paletteHex={paletteHex} />}
          {panel === 'palette' && (
            <div className="card p-5">
              <p className="eyebrow">Base coat</p>
              <p className="mb-4 mt-1 text-sm text-ink-soft">{lesson.basecoat}</p>
              <PalettePanel lesson={lesson} activeColors={step.colors} />
            </div>
          )}
          {panel === 'tools' && (
            <div className="card p-5">
              <ToolsPanel lesson={lesson} activeTool={step.tool} />
            </div>
          )}

          <AskInstructor instructorName={settings.instructorName} pending={asking} answer={answer} error={askError} lastQuestion={lastQuestion} onAsk={ask} />

          {stepIndex === total - 1 && (
            <div className="card border-cadmium/40 bg-cadmium-soft/40 p-5">
              <p className="font-display-text text-lg leading-relaxed">{lesson.closing}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PanelTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn('tab flex-1')}>
      {children}
    </button>
  )
}
