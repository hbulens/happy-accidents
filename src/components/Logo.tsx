export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id="lg-sheen" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <path d="M12 40c-6-10 3-23 14-22 9 0 12 8 20 6 9-2 13 10 5 17-8 6-32 10-39-1z" fill="#1c3a5e" />
      <path d="M12 40c-6-10 3-23 14-22 9 0 12 8 20 6 9-2 13 10 5 17-8 6-32 10-39-1z" fill="url(#lg-sheen)" />
      <path d="M31 21c7-6 20-4 21 6 1 8-9 12-16 9-6-2-11-9-5-15z" fill="#8f2033" />
      <path d="M31 21c7-6 20-4 21 6 1 8-9 12-16 9-6-2-11-9-5-15z" fill="url(#lg-sheen)" />
      <path d="M21 35c5-4 14-2 15 4 1 6-6 9-11 7-4-2-8-7-4-11z" fill="#e9b331" />
      <path d="M21 35c5-4 14-2 15 4 1 6-6 9-11 7-4-2-8-7-4-11z" fill="url(#lg-sheen)" />
    </svg>
  )
}
