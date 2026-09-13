import { useCallback, useEffect, useRef, useState } from 'react'
import { parseCommand, type VoiceCommand } from '@/features/lessons/utils/commands'

// Continuous, hands-free listening built on the Web Speech API. Chrome and
// Safari support it; Firefox does not. Recognition stops itself after a pause
// or after ~60s, so we restart it whenever it ends while still enabled, and we
// hold it while the instructor is speaking so it does not transcribe the TTS.

type RecognitionCtor = new () => SpeechRecognitionLike

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: any) => void) | null
  onend: (() => void) | null
  onerror: ((e: any) => void) | null
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as RecognitionCtor | null
}

export type VoiceStatus = 'unsupported' | 'off' | 'listening' | 'holding' | 'denied' | 'error'

interface Options {
  enabled: boolean
  hold: boolean
  onCommand: (cmd: VoiceCommand, transcript: string) => void
}

export function useVoiceCommands({ enabled, hold, onCommand }: Options) {
  const [status, setStatus] = useState<VoiceStatus>('off')
  const [lastHeard, setLastHeard] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand
  const activeRef = useRef(false)

  const supported = getRecognitionCtor() !== null

  const stop = useCallback(() => {
    activeRef.current = false
    recognitionRef.current?.abort()
    recognitionRef.current = null
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || recognitionRef.current) return
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text: string = result[0]?.transcript ?? ''
        if (result.isFinal) {
          const cmd = parseCommand(text)
          setLastHeard(text.trim())
          if (cmd.type !== 'ignore') onCommandRef.current(cmd, text.trim())
        } else {
          interim += text
        }
      }
      if (interim) setLastHeard(interim.trim())
    }
    rec.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        activeRef.current = false
        setStatus('denied')
      } else if (e?.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        setStatus('error')
      }
    }
    rec.onend = () => {
      recognitionRef.current = null
      // Chrome ends sessions on silence; restart while still wanted.
      if (activeRef.current) {
        setTimeout(() => {
          if (activeRef.current && !recognitionRef.current) start()
        }, 250)
      }
    }
    recognitionRef.current = rec
    try {
      rec.start()
      setStatus('listening')
    } catch {
      recognitionRef.current = null
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    if (!enabled) {
      stop()
      setStatus('off')
      return
    }
    if (hold) {
      // Instructor is talking: release the mic so we don't transcribe ourselves.
      activeRef.current = false
      recognitionRef.current?.abort()
      recognitionRef.current = null
      setStatus('holding')
      return
    }
    activeRef.current = true
    start()
    return () => {
      activeRef.current = false
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [enabled, hold, supported, start, stop])

  return { status, lastHeard, supported }
}
