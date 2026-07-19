import type { EnvironmentConfig } from "./types.ts";

export const localEnvironment: EnvironmentConfig = {
  id: "local",
  appMode: "development",
  seedStrategy: "free",
  analyticsStrategy: "off",
  loginStrategy: "persona-credentials",
  cleanupStrategy: "manifest-local",
  allowedPersonaIds: "*",
  allowPlaywright: true,
  allowSeed: true,
  allowCleanup: true,
  description: "Desenvolvimento local — seeds livres + personas.",
};
