import type { EnvironmentConfig } from "./types.ts";

export const stagingEnvironment: EnvironmentConfig = {
  id: "staging",
  appMode: "sandbox",
  seedStrategy: "demo",
  analyticsStrategy: "demo-only",
  loginStrategy: "persona-credentials",
  cleanupStrategy: "demo-reset",
  allowedPersonaIds: "*",
  allowPlaywright: true,
  allowSeed: true,
  allowCleanup: true,
  description: "Homologação — dados de demonstração, sem usuários reais de mercado.",
};
