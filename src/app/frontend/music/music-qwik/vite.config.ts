import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
  ],
  // Deployed under https://music.mariolopez.org/qwik/
  // Vite requires base to start and end with `/`.
  base: '/qwik/',
  build: {
    minify: 'esbuild',
    reportCompressedSize: true
  },
})
