import type { EnvironmentConfig } from "./types.ts";

export const productionEnvironment: EnvironmentConfig = {
  id: "production",
  appMode: "production",
  seedStrategy: "forbidden",
  analyticsStrategy: "real-users-only",
  loginStrategy: "real-oauth",
  cleanupStrategy: "forbidden",
  allowedPersonaIds: [],
  allowPlaywright: false,
  allowSeed: false,
  allowCleanup: false,
  description: "Produção — operação real. Infra de testes nunca corre aqui.",
};
