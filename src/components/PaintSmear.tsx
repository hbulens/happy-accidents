// A thick, glossy smear of oil paint. Decorative, used behind headings and as
// section markers. Renders with an impasto highlight ridge.
export function PaintSmear({
  color = '#8f2033',
  className = '',
  animate = false,
}: {
  color?: string
  className?: string
  animate?: boolean
}) {
  const id = `smear-${color.replace('#', '')}`
  const d = 'M8 26 C 60 6, 120 40, 190 22 S 320 4, 392 20'
  return (
    <svg viewBox="0 0 400 44" className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" className={animate ? 'stroke-in' : undefined} />
      <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth="22" strokeLinecap="round" className={animate ? 'stroke-in' : undefined} />
      <path d={d} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" transform="translate(0,-6)" className={animate ? 'stroke-in' : undefined} />
    </svg>
  )
}
