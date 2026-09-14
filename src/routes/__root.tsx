/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouter } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import appCss from '@/index.css?url'
import { Logo } from '@/components/Logo'

const SITE_NAME = 'Happy Accidents'
const DESCRIPTION =
  'Step-by-step wet-on-wet oil painting lessons, read aloud and voice-controlled, from an imagined scene or your own photo.'

export const Route = createRootRoute({
  head: () => ({
    title: `${SITE_NAME} · wet-on-wet painting lessons`,
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#7a3b1e' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
})

function RootShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <ClientEntryScript />
      </body>
    </html>
  )
}

/**
 * Workaround for a TanStack Start regression where the SSR manifest leaves the
 * root route assets undefined, so <Scripts /> emits nothing and the client
 * bundle never boots. Emitting the first root preload as a module script fixes
 * it; if upstream fixes it this becomes a no-op thanks to Start's dedup guard.
 */
function ClientEntryScript() {
  const router = useRouter()
  const preloads = router.ssr?.manifest?.routes?.__root__?.preloads ?? []
  const first = preloads[0]
  const entry = typeof first === 'string' ? first : first?.href
  if (!entry) return null
  return <script type="module" async src={entry} />
}

function RootComponent() {
  return (
    <>
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-medium tracking-tight">Happy Accidents</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link nav-link-active' }} activeOptions={{ exact: true }}>
            New painting
          </Link>
          <Link to="/library" className="nav-link" activeProps={{ className: 'nav-link nav-link-active' }}>
            My paintings
          </Link>
        </div>
      </nav>
      <Outlet />
      <Toaster position="bottom-center" richColors />
    </>
  )
}
