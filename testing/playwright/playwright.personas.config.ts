import { defineConfig } from "@playwright/test";

/**
 * Config isolada da infra de testing — não altera o playwright.config do produto.
 * Fluxos UI completos continuam em frontend/runtime_console_v3/e2e (com bridge de personas).
 */
export default defineConfig({
  testDir: ".",
  testMatch: /persona-flows\.spec\.ts/,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
  projects: [{ name: "personas-unit", testMatch: /persona-flows\.spec\.ts/ }],
});
