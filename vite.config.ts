import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nitro } from 'nitro/vite'

export default defineConfig({
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
