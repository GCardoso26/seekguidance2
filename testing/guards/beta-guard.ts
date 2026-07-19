/**
 * Bloqueio absoluto: Beta / Production nunca recebem seed, cleanup,
 * Playwright, fixtures ou personas automatizadas.
 *
 * Invariante de mercado: LPC / LCS / Supply Depth só medem usuários reais.
 */

import { getEnvironmentConfig } from "../config/environments/index.ts";

export class BetaContaminationError extends Error {
  constructor(operation: string, envId: string) {
    super(
      `[TESTING GUARD] Operação "${operation}" BLOQUEADA em ambiente "${envId}". ` +
        `Beta/Produção só aceitam usuários reais — seeds/Playwright/personas contaminariam LPC/LCS. ` +
        `Use JUDGE_TEST_ENV=local|ci|staging.`,
    );
    this.name = "BetaContaminationError";
  }
}

export type GuardOperation =
  | "seed"
  | "cleanup"
  | "playwright"
  | "fixtures"
  | "personas"
  | "smoke-mutating";

/**
 * Lança se a operação não for permitida no ambiente atual.
 * Toda suíte automatizada deve chamar isto no bootstrap.
 */
export function assertTestingOperationAllowed(
  operation: GuardOperation,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const cfg = getEnvironmentConfig(env);

  if (cfg.id === "beta" || cfg.id === "production") {
    throw new BetaContaminationError(operation, cfg.id);
  }

  switch (operation) {
    case "seed":
      if (!cfg.allowSeed) throw new BetaContaminationError(operation, cfg.id);
      break;
    case "cleanup":
      if (!cfg.allowCleanup) throw new BetaContaminationError(operation, cfg.id);
      break;
    case "playwright":
    case "fixtures":
    case "personas":
      if (!cfg.allowPlaywright) throw new BetaContaminationError(operation, cfg.id);
      break;
    case "smoke-mutating":
      if (!cfg.allowSeed) throw new BetaContaminationError(operation, cfg.id);
      break;
    default:
      break;
  }
}

/** CLI entry: node testing/guards/assert-not-beta.mjs <operation> */
export function runGuardCli(argv: string[] = process.argv.slice(2)): void {
  const op = (argv[0] || "seed") as GuardOperation;
  assertTestingOperationAllowed(op);
  const cfg = getEnvironmentConfig();
  console.log(`✓ testing guard OK — env=${cfg.id} operation=${op}`);
}
