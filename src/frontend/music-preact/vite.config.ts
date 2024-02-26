import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: 'https://music.mariolopez.org/preact',
  build: {
    minify: 'esbuild',
    reportCompressedSize: true
  }
})
