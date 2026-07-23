import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./e2e/load-env";

loadE2eEnv(__dirname);

const webServerEnv = {
  CI: process.env.CI || "",
  API_PROXY_TARGET: process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 60_000,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: [/.*\.setup\.ts/, /visual-regression\.spec\.ts/],
    },
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ["setup"],
      testMatch: /visual-regression\.spec\.ts/,
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
      testIgnore: [/.*\.setup\.ts/, /visual-regression\.spec\.ts/],
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_NO_WEBSERVER === "1" ||
    (process.env.BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL))
      ? undefined
      : process.env.CI
        ? {
            command: "npm run start",
            url: "http://localhost:3000",
            reuseExistingServer: false,
            timeout: 120_000,
            env: webServerEnv,
          }
        : {
            command: "npm run dev",
            url: "http://localhost:3000",
            reuseExistingServer: !process.env.E2E_FRESH_SERVER,
            timeout: 120_000,
            env: webServerEnv,
          },
});
