import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: "https://music.mariolopez.org/preact",
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
