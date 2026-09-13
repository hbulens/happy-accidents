import type { Lesson } from '@/features/lessons/schema'
import { resolveHex } from '@/features/lessons/palette'
import { cn } from '@/lib/utils'

interface Props {
  lesson: Lesson
  activeColors?: string[]
  compact?: boolean
}

export function PalettePanel({ lesson, activeColors = [], compact = false }: Props) {
  const active = new Set(activeColors.map((c) => c.toLowerCase()))
  return (
    <ul className={cn('grid gap-2', compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3')}>
      {lesson.palette.map((color) => {
        const hex = resolveHex(color.name, color.hex)
        const isActive = active.has(color.name.toLowerCase())
        return (
          <li
            key={color.name}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-2 transition',
              isActive ? 'border-sienna/50 bg-white shadow-sm' : 'border-transparent bg-white/50',
              compact && 'flex-col gap-1 p-1.5 text-center',
            )}
            title={color.role}
          >
            <span
              className="h-9 w-9 shrink-0 rounded-full ring-2 ring-white shadow"
              style={{ background: hex }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className={cn('block truncate font-medium', compact ? 'text-[11px]' : 'text-sm')}>{color.name}</span>
              {!compact && <span className="block text-xs text-ink-soft">{color.role}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
