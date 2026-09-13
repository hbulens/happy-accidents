import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultNotFoundComponent: () => (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-3xl">That canvas is blank.</h1>
        <p className="mt-2 text-ink-soft">There's nothing here yet. Head back and paint something.</p>
        <a href="/" className="btn-primary mt-6 inline-block">Back to the easel</a>
      </main>
    ),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
