// A loose brush stroke used as a divider or an animated "painting" indicator.
export function BrushStroke({
  className = '',
  color = '#b8252f',
  animate = false,
}: {
  className?: string
  color?: string
  animate?: boolean
}) {
  const d = 'M6 24c40-14 70-10 110-6s70 10 110 2 70-14 110-8 50 8 58 14'
  return (
    <svg viewBox="0 0 400 40" className={className} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" className={animate ? 'stroke-in' : undefined} opacity="0.9" />
      <path d={d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" transform="translate(0,-4)" />
    </svg>
  )
}
