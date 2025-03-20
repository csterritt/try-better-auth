import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx',
      injectClientScript: false,
    }),
  ],
  server: { port: 3000 },
})
