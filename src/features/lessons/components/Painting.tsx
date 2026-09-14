import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  src: string | null
  alt: string
  pending?: boolean
  note?: string
  className?: string
}

/** A picture on the easel, or a blank primed canvas while it is being painted. */
export function Painting({ src, alt, pending = false, note, className }: Props) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])
  return (
    <div className={cn('relative overflow-hidden bg-[#f4efe3]', className)}>
      {src && !broken ? (
        <img src={src} alt={alt} className="block h-full w-full object-cover" draggable={false} onError={() => setBroken(true)} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#faf6ec,#ece4d3)] p-6 text-center">
          <div className={cn('h-10 w-10 rounded-full border-2 border-ink-faint/40', pending && 'animate-spin border-t-alizarin')} />
          <p className="font-display-text mt-4 text-lg text-ink-soft">{note ?? (pending ? 'Painting…' : 'No picture yet')}</p>
        </div>
      )}
    </div>
  )
}
