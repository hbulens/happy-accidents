import type { Lesson } from '@/features/lessons/schema'
import { cn } from '@/lib/utils'

interface Props {
  lesson: Lesson
  activeTool?: string
}

export function ToolsPanel({ lesson, activeTool }: Props) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {lesson.tools.map((tool) => {
        const isActive = activeTool?.toLowerCase() === tool.name.toLowerCase()
        return (
          <li key={tool.name} className={cn('flex items-start gap-3 rounded-xl border p-3', isActive ? 'border-prussian/40 bg-prussian-soft/60' : 'border-transparent bg-white/50')}>
            <ToolGlyph name={tool.name} />
            <span>
              <span className="font-display-text block text-lg leading-tight">{tool.name}</span>
              <span className="block text-xs text-ink-soft">{tool.role}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function ToolGlyph({ name }: { name: string }) {
  const n = name.toLowerCase()
  const knife = n.includes('knife')
  const fan = n.includes('fan')
  const liner = n.includes('liner')
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden>
      {knife ? (
        <>
          <path d="M6 34 L18 22" stroke="#6f4728" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 20 L34 6 L36 14 L22 26 Z" fill="#cfcfcf" stroke="#7a7a7a" strokeWidth="1" />
        </>
      ) : fan ? (
        <>
          <path d="M20 36 V22" stroke="#6f4728" strokeWidth="3" strokeLinecap="round" />
          <path d="M8 20 Q20 4 32 20 Z" fill="#d8b56f" stroke="#a37c3c" strokeWidth="1" />
        </>
      ) : liner ? (
        <>
          <path d="M8 34 L24 18" stroke="#6f4728" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 18 L34 6" stroke="#3b2a1a" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M20 36 V20" stroke="#6f4728" strokeWidth="4" strokeLinecap="round" />
          <rect x="10" y="6" width="20" height="14" rx="2" fill="#d8b56f" stroke="#a37c3c" strokeWidth="1" />
        </>
      )}
    </svg>
  )
}
