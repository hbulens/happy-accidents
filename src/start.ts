import { createStart } from '@tanstack/react-start'

// Client-rendered app. The root shell is still SSR'd so the HTML has a head.
export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
