#!/usr/bin/env node
/**
 * Fail-closed guard for seed/cleanup/playwright against beta/production.
 * Usage: node testing/guards/assert-not-beta.mjs [seed|cleanup|playwright|fixtures|personas]
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

async function main() {
  // Prefer compiled-free TS via dynamic import of .ts when node --experimental-strip-types,
  // fallback: inline JS mirror for zero-build CI.
  const op = process.argv[2] || "seed";
  const envId = resolveEnv();
  if (envId === "beta" || envId === "production") {
    console.error(
      `[TESTING GUARD] Operação "${op}" BLOQUEADA em ambiente "${envId}". ` +
        `Beta/Produção só aceitam usuários reais — seeds/Playwright/personas contaminariam LPC/LCS.`,
    );
    process.exit(1);
  }
  const allowSeed = envId !== "beta" && envId !== "production";
  if ((op === "seed" || op === "cleanup") && !allowSeed) {
    process.exit(1);
  }
  if (
    (op === "playwright" || op === "fixtures" || op === "personas") &&
    (envId === "beta" || envId === "production")
  ) {
    process.exit(1);
  }
  console.log(`✓ testing guard OK — env=${envId} operation=${op}`);
}

function resolveEnv() {
  const explicit = (process.env.JUDGE_TEST_ENV || process.env.TEST_ENV || "").trim().toLowerCase();
  if (["local", "ci", "staging", "beta", "production"].includes(explicit)) return explicit;
  const appMode = (process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE || "").trim().toLowerCase();
  const environment = (process.env.ENVIRONMENT || "").trim().toLowerCase();
  if (environment === "production" || appMode === "production") return "production";
  if (appMode === "beta" || process.env.JUDGE_BETA === "1") return "beta";
  if (process.env.CI === "true" || process.env.CI === "1") return "ci";
  if (appMode === "sandbox" || process.env.JUDGE_STAGING === "1") return "staging";
  return "local";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
