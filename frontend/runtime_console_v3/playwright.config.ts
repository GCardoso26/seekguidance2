import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./e2e/load-env";

loadE2eEnv(__dirname);

const webServerEnv = {
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
      testIgnore: /.*\.setup\.ts/,
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  webServer: process.env.CI
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
