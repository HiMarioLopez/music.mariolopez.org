import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "https://music.mariolopez.org/react",
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
