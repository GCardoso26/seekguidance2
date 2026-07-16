import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    // PG integration tests share DATABASE_URL — avoid cross-file wipe races.
    fileParallelism: false,
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
