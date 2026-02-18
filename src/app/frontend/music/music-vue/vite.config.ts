import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "https://music.mariolopez.org/vue",
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    minify: "esbuild",
    reportCompressedSize: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "https://music.mariolopez.org",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
