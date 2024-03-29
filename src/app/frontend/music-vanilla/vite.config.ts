import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: 'https://music.mariolopez.org/vanilla',
    build: {
        minify: 'esbuild',
        reportCompressedSize: true
    }
})
