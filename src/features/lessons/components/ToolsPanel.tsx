import { Brush } from 'lucide-react'
import type { Lesson } from '@/features/lessons/schema'
import { cn } from '@/lib/utils'

interface Props {
  lesson: Lesson
  activeTool?: string
}

export function ToolsPanel({ lesson, activeTool }: Props) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {lesson.tools.map((tool) => {
        const isActive = activeTool?.toLowerCase() === tool.name.toLowerCase()
        return (
          <li
            key={tool.name}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3',
              isActive ? 'border-phthalo/40 bg-phthalo-soft' : 'border-transparent bg-white/50',
            )}
          >
            <Brush className="mt-0.5 h-4 w-4 shrink-0 text-phthalo" />
            <span>
              <span className="block text-sm font-medium">{tool.name}</span>
              <span className="block text-xs text-ink-soft">{tool.role}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
