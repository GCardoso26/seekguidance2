import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: { environment: "node", globals: false, exclude: ["e2e/**", "node_modules/**"] },
  esbuild: {
    jsx: "automatic",
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
