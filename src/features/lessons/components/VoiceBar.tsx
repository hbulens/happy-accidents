import { Ear, EarOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import type { VoiceStatus } from '@/features/lessons/hooks/useVoiceCommands'
import { cn } from '@/lib/utils'

interface Props {
  status: VoiceStatus
  lastHeard: string
  enabled: boolean
  onToggle: () => void
  autoRead: boolean
  onToggleAutoRead: () => void
  speaking: boolean
  onStopSpeaking: () => void
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  unsupported: 'Voice control needs Chrome, Edge or Safari',
  off: 'Voice control off',
  listening: 'Listening',
  holding: 'Talking, mic paused',
  denied: 'Microphone blocked. Allow it in the browser address bar.',
  error: 'Mic hiccup, retrying',
}

export function VoiceBar({
  status,
  lastHeard,
  enabled,
  onToggle,
  autoRead,
  onToggleAutoRead,
  speaking,
  onStopSpeaking,
}: Props) {
  const listening = status === 'listening'
  return (
    <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={status === 'unsupported'}
        className={cn(
          'relative inline-flex h-11 w-11 items-center justify-center rounded-full transition',
          enabled ? 'bg-crimson text-white' : 'bg-canvas-deep text-ink-soft hover:bg-white',
        )}
        aria-pressed={enabled}
        aria-label={enabled ? 'Turn voice control off' : 'Turn voice control on'}
        title={enabled ? 'Turn voice control off' : 'Turn voice control on'}
      >
        {enabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-crimson/40" aria-hidden />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{STATUS_LABEL[status]}</p>
        <p className="truncate text-xs text-ink-soft">
          {enabled && lastHeard ? `Heard: "${lastHeard}"` : 'Say "next", "back", "repeat", "tips", "palette", or ask "Bob, how do I…"'}
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleAutoRead}
        className={cn('btn-ghost', autoRead && 'bg-canvas-deep text-ink')}
        aria-pressed={autoRead}
        title="Read each step aloud when it opens"
      >
        {autoRead ? <Ear className="h-4 w-4" /> : <EarOff className="h-4 w-4" />}
        <span className="hidden sm:inline">Read aloud</span>
      </button>

      <button
        type="button"
        onClick={onStopSpeaking}
        disabled={!speaking}
        className="btn-ghost"
        title="Stop the instructor"
      >
        {speaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span className="hidden sm:inline">{speaking ? 'Hush' : 'Quiet'}</span>
      </button>
    </div>
  )
}
