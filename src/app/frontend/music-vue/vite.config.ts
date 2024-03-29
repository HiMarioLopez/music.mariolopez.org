import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: 'https://music.mariolopez.org/vue',
  build: {
    minify: 'esbuild',
    reportCompressedSize: true
  }
})
