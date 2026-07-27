import { Pool } from "pg";

function pgUrl(raw: string): string {
  return raw.replace(/^postgresql\+asyncpg:/, "postgresql:");
}

/**
 * Shared Pool for product-catalog (cron / workers / CLI).
 * Supabase Session pooler caps clients (often pool_size=15); default pg max=10
 * per process blows the budget when API + workers + crons overlap.
 */
export function createCatalogPgPool(opts?: {
  connectionString?: string;
  /** Override max clients for this process (tick=1, workers≈concurrency+1). */
  max?: number;
}): Pool {
  const raw = opts?.connectionString ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL required");

  const fromEnv = Number(process.env.PG_POOL_MAX);
  const max =
    opts?.max ??
    (Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3);

  return new Pool({
    connectionString: pgUrl(raw),
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 20_000,
  });
}
