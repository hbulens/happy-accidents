import type { Lesson } from '@/features/lessons/schema'
import { resolveHex } from '@/features/lessons/palette'
import { cn } from '@/lib/utils'

interface Props {
  lesson: Lesson
  activeColors?: string[]
}

export function PalettePanel({ lesson, activeColors = [] }: Props) {
  const active = new Set(activeColors.map((c) => c.toLowerCase()))
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {lesson.palette.map((color) => {
        const hex = resolveHex(color.name, color.hex)
        const isActive = active.has(color.name.toLowerCase())
        return (
          <li
            key={color.name}
            className={cn('flex items-center gap-4 rounded-xl border p-3 transition', isActive ? 'border-cadmium/60 bg-cadmium-soft/40' : 'border-transparent bg-white/50')}
            title={color.role}
          >
            <span className="swatch h-10 w-12 shrink-0" style={{ background: hex }} aria-hidden />
            <span className="min-w-0">
              <span className="font-display-text block text-lg leading-tight">{color.name}</span>
              <span className="block text-xs text-ink-soft">{color.role}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
