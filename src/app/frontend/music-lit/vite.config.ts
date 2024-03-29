import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: 'https://music.mariolopez.org/lit',
    build: {
        minify: 'esbuild',
        reportCompressedSize: true
    }
})
