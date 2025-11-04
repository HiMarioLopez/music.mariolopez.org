import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      fileURLToPath(new URL("./src/setupTests.ts", import.meta.url)),
    ],
  },
});
