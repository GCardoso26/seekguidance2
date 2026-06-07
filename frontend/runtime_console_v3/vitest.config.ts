import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: { environment: "node", globals: false },
  esbuild: {
    jsx: "automatic",
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
