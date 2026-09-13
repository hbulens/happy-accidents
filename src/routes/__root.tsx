/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Link, Outlet, Scripts, useRouter } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import appCss from '@/index.css?url'

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
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="font-display text-lg tracking-tight text-sienna">
          Happy Accidents
        </Link>
        <div className="flex gap-1 text-sm">
          <Link to="/" className="btn-ghost" activeProps={{ className: 'btn-ghost bg-canvas-deep text-ink' }} activeOptions={{ exact: true }}>
            New painting
          </Link>
          <Link to="/library" className="btn-ghost" activeProps={{ className: 'btn-ghost bg-canvas-deep text-ink' }}>
            My paintings
          </Link>
        </div>
      </nav>
      <Outlet />
      <Toaster position="bottom-center" richColors />
    </>
  )
}
