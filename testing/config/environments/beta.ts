import type { EnvironmentConfig } from "./types.ts";

/**
 * BETA — validação de mercado (LPC / LCS / Supply Depth).
 * Qualquer automação de seed/cleanup/Playwright/personas DEVE falhar aqui.
 */
export const betaEnvironment: EnvironmentConfig = {
  id: "beta",
  appMode: "beta",
  seedStrategy: "forbidden",
  analyticsStrategy: "real-users-only",
  loginStrategy: "real-oauth",
  cleanupStrategy: "forbidden",
  allowedPersonaIds: [],
  allowPlaywright: false,
  allowSeed: false,
  allowCleanup: false,
  description:
    "Beta Sprint 8 — apenas usuários reais. Zero seeds, zero Playwright, zero personas.",
};
