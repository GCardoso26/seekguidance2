import type { EnvironmentConfig } from "./types.ts";

export const ciEnvironment: EnvironmentConfig = {
  id: "ci",
  appMode: "sandbox",
  seedStrategy: "deterministic-personas",
  analyticsStrategy: "isolated-test",
  loginStrategy: "persona-credentials",
  cleanupStrategy: "full-ci",
  allowedPersonaIds: "*",
  allowPlaywright: true,
  allowSeed: true,
  allowCleanup: true,
  description: "CI — personas determinísticas, seed → Playwright → smoke → cleanup.",
};
