import { useCallback, useEffect, useRef, useState } from 'react'

// Text-to-speech via the browser. Exposes a `speaking` flag so voice
// recognition can pause while the instructor talks (otherwise it hears itself).

export function useSpeech(rate = 0.92) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setSupported(true)
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return
      const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
      const preferred =
        en.find((v) => /daniel|alex|fred|aaron|guy|ryan|matthew|male/i.test(v.name)) ??
        en.find((v) => v.default) ??
        en[0] ??
        voices[0]
      voiceRef.current = preferred ?? null
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = 0.95
      if (voiceRef.current) utterance.voice = voiceRef.current
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [rate],
  )

  useEffect(() => cancel, [cancel])

  return { speak, cancel, speaking, supported }
}
