import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nitro } from 'nitro/vite'

// Server-only secrets live in .env / .env.local. Vite does not put them on
// process.env by itself, so load them here for the SSR/API side. Files are
// read once at startup: restart `bun dev` after editing them.
const SERVER_ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'REPLICATE_API_TOKEN',
  'HAPPY_ACCIDENTS_EFFORT',
  'HAPPY_ACCIDENTS_PAINT_MODEL',
  'HAPPY_ACCIDENTS_EDIT_MODEL',
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of SERVER_ENV_KEYS) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }
  return config
})

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true },
      // The vercel preset does not emit dist/server/server.js, which the SPA
      // prerender step would try to import. Skip prerendering entirely.
      prerender: { filter: () => false },
    }),
    nitro(),
    viteReact(),
  ],
  nitro: {
    preset: 'vercel',
    compatibilityDate: '2025-10-18',
  },
  ssr: {
    // Server-only SDK: keep it out of the client bundle.
    external: ['@anthropic-ai/sdk'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts'],
  },
})
