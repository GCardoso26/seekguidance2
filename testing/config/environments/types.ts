/**
 * Ambiente de teste JudgeTCG — camada exclusiva de QA.
 * NÃO faz parte do produto. NÃO toca LPC/LCS/Sprint 8.
 */

export type TestEnvironmentId =
  | "local"
  | "ci"
  | "staging"
  | "beta"
  | "production";

export type SeedStrategy =
  | "free" // seeds livres / ad-hoc
  | "deterministic-personas" // personas fixas
  | "demo" // dados de demonstração
  | "forbidden"; // nunca seed

export type AnalyticsStrategy =
  | "off"
  | "isolated-test" // eventos em namespace de teste (não LPC)
  | "demo-only"
  | "real-users-only"; // beta/prod

export type LoginStrategy =
  | "supabase-test-users"
  | "persona-credentials"
  | "real-oauth"
  | "forbidden-automation";

export type CleanupStrategy =
  | "manifest-local"
  | "full-ci"
  | "demo-reset"
  | "forbidden";

export type EnvironmentConfig = {
  id: TestEnvironmentId;
  /** APP_MODE / NEXT_PUBLIC_APP_MODE espelhado */
  appMode: "development" | "sandbox" | "beta" | "production";
  seedStrategy: SeedStrategy;
  analyticsStrategy: AnalyticsStrategy;
  loginStrategy: LoginStrategy;
  cleanupStrategy: CleanupStrategy;
  /** Personas permitidas neste ambiente (ids). Vazio = nenhuma. */
  allowedPersonaIds: string[] | "*";
  /** Automação Playwright / fixtures permitida? */
  allowPlaywright: boolean;
  /** Seeds / cleanup CLI permitidos? */
  allowSeed: boolean;
  allowCleanup: boolean;
  description: string;
};

export function resolveTestEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): TestEnvironmentId {
  const explicit = (env.JUDGE_TEST_ENV || env.TEST_ENV || "").trim().toLowerCase();
  if (
    explicit === "local" ||
    explicit === "ci" ||
    explicit === "staging" ||
    explicit === "beta" ||
    explicit === "production"
  ) {
    return explicit;
  }

  const appMode = (env.APP_MODE || env.NEXT_PUBLIC_APP_MODE || "").trim().toLowerCase();
  const environment = (env.ENVIRONMENT || "").trim().toLowerCase();

  if (environment === "production" || appMode === "production") return "production";
  if (appMode === "beta" || env.JUDGE_BETA === "1") return "beta";
  if (env.CI === "true" || env.CI === "1" || appMode === "ci") return "ci";
  if (appMode === "sandbox" || env.JUDGE_STAGING === "1") return "staging";
  return "local";
}
