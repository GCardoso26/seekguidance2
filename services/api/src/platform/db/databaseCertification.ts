/**
 * Database Certification runner — infrastructure gate before Scryfall SHADOW.
 * Usage: DATABASE_URL=... npx tsx src/platform/db/runDatabaseCertification.ts
 */
import { Pool, type PoolClient } from "pg";

export interface PerformanceBudget {
  persistCardMs: number;
  persistVariantMs: number;
  publishOutboxMs: number;
  claimOutboxMs: number;
  searchProjectionMs: number;
  /** Soft budget for later; not enforced in this runner. */
  shadowSync10kCardsMinutes: number;
}

/** Frozen performance budget — FOUNDATION_FREEZE §15. */
export const PERFORMANCE_BUDGET: PerformanceBudget = {
  persistCardMs: 20,
  persistVariantMs: 10,
  publishOutboxMs: 100,
  claimOutboxMs: 1_000,
  searchProjectionMs: 5_000,
  shadowSync10kCardsMinutes: 30,
};

export interface CertCheck {
  id: string;
  ok: boolean;
  detail: string;
  ms?: number;
}

export interface CertReport {
  passed: boolean;
  checks: CertCheck[];
}

const REQUIRED_INDEXES = [
  "idx_outbox_claim",
  "idx_outbox_dead",
  "idx_outbox_correlation",
  "uq_provider_mappings_object",
  "idx_catalog_cards_game_name",
];

export async function runDatabaseCertification(
  connectionString: string,
  budget: PerformanceBudget = PERFORMANCE_BUDGET,
): Promise<CertReport> {
  const checks: CertCheck[] = [];
  const pool = new Pool({ connectionString });

  try {
    await pool.query("SELECT 1");
    checks.push({ id: "connectivity", ok: true, detail: "SELECT 1 ok" });

    for (const schema of ["catalog", "platform"]) {
      const r = await pool.query(`SELECT 1 FROM pg_namespace WHERE nspname = $1`, [schema]);
      checks.push({
        id: `schema_${schema}`,
        ok: r.rowCount === 1,
        detail: r.rowCount === 1 ? `schema ${schema} exists` : `missing schema ${schema}`,
      });
    }

    const tables = [
      "platform.outbox_events",
      "platform.consumer_offsets",
      "catalog.catalog_games",
      "catalog.catalog_sets",
      "catalog.catalog_cards",
      "catalog.catalog_variants",
      "catalog.provider_mappings",
    ];
    for (const t of tables) {
      const [schema, name] = t.split(".");
      const r = await pool.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schema, name],
      );
      checks.push({
        id: `table_${t}`,
        ok: (r.rowCount ?? 0) > 0,
        detail: (r.rowCount ?? 0) > 0 ? `${t} exists` : `missing ${t}`,
      });
    }

    for (const col of [
      { table: "catalog_cards", column: "row_version" },
      { table: "catalog_sets", column: "row_version" },
      { table: "catalog_variants", column: "row_version" },
      { table: "provider_mappings", column: "row_version" },
    ]) {
      const r = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'catalog' AND table_name = $1 AND column_name = $2`,
        [col.table, col.column],
      );
      checks.push({
        id: `col_${col.table}_${col.column}`,
        ok: (r.rowCount ?? 0) > 0,
        detail:
          (r.rowCount ?? 0) > 0
            ? `${col.table}.${col.column} exists`
            : `missing ${col.table}.${col.column}`,
      });
    }

    {
      const r = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'platform' AND table_name = 'outbox_events' AND column_name = 'committed_at'`,
      );
      checks.push({
        id: "col_outbox_committed_at",
        ok: (r.rowCount ?? 0) > 0,
        detail: (r.rowCount ?? 0) > 0 ? "committed_at exists" : "missing committed_at",
      });
    }

    for (const idx of REQUIRED_INDEXES) {
      const r = await pool.query(`SELECT 1 FROM pg_indexes WHERE indexname = $1`, [idx]);
      checks.push({
        id: `index_${idx}`,
        ok: (r.rowCount ?? 0) > 0,
        detail: (r.rowCount ?? 0) > 0 ? `index ${idx}` : `missing index ${idx}`,
      });
    }

    // FK smoke: cards.set_id references sets
    {
      const r = await pool.query(
        `SELECT 1 FROM information_schema.table_constraints
         WHERE table_schema = 'catalog' AND table_name = 'catalog_cards'
           AND constraint_type = 'FOREIGN KEY'`,
      );
      checks.push({
        id: "fk_catalog_cards",
        ok: (r.rowCount ?? 0) > 0,
        detail: `catalog_cards FKs count=${r.rowCount ?? 0}`,
      });
    }

    // SKIP LOCKED + lease smoke
    const skip = await certifySkipLocked(pool);
    checks.push(skip);

    // Persist card timing (SQL-level smoke against budget)
    const persist = await certifyPersistCardTiming(pool, budget.persistCardMs);
    checks.push(persist);

    // Claim timing
    const claim = await certifyClaimTiming(pool, budget.claimOutboxMs);
    checks.push(claim);
  } catch (err) {
    checks.push({
      id: "runner_error",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await pool.end();
  }

  return { passed: checks.every((c) => c.ok), checks };
}

async function certifySkipLocked(pool: Pool): Promise<CertCheck> {
  const id = crypto.randomUUID();
  const clientA = await pool.connect();
  const clientB = await pool.connect();
  try {
    await clientA.query("BEGIN");
    await clientA.query(
      `INSERT INTO platform.outbox_events (
         id, aggregate_type, aggregate_id, event_name, event_version, schema_version,
         payload, status, attempts, max_attempts, correlation_id, committed_at
       ) VALUES ($1,'cert','cert','CertEvent',1,1,'{}'::jsonb,'pending',0,5,'cert',now())`,
      [id],
    );
    await clientA.query("COMMIT");

    await clientA.query("BEGIN");
    const a = await clientA.query(
      `SELECT id FROM platform.outbox_events WHERE id = $1 FOR UPDATE SKIP LOCKED`,
      [id],
    );
    await clientB.query("BEGIN");
    const b = await clientB.query(
      `SELECT id FROM platform.outbox_events WHERE id = $1 FOR UPDATE SKIP LOCKED`,
      [id],
    );
    await clientB.query("ROLLBACK");
    await clientA.query("ROLLBACK");

    const ok = a.rowCount === 1 && b.rowCount === 0;
    return {
      id: "skip_locked",
      ok,
      detail: ok
        ? "second session skipped locked row"
        : `unexpected a=${a.rowCount} b=${b.rowCount}`,
    };
  } catch (err) {
    return {
      id: "skip_locked",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await cleanupOutbox(clientA, id).catch(() => undefined);
    clientA.release();
    clientB.release();
  }
}

async function cleanupOutbox(client: PoolClient, id: string): Promise<void> {
  await client.query(`DELETE FROM platform.outbox_events WHERE id = $1`, [id]);
}

async function certifyPersistCardTiming(pool: Pool, budgetMs: number): Promise<CertCheck> {
  const gameId = crypto.randomUUID();
  const cardId = crypto.randomUUID();
  const slug = `cert-${gameId.slice(0, 8)}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO catalog.catalog_games (id, code, name, slug)
       VALUES ($1, $2, $3, $4)`,
      [gameId, `C${gameId.slice(0, 7)}`, "Cert Game", slug],
    );
    const t0 = performance.now();
    await client.query(
      `INSERT INTO catalog.catalog_cards (
         id, game_id, name, normalized_name, row_version
       ) VALUES ($1, $2, 'Cert Card', 'cert card', 1)`,
      [cardId, gameId],
    );
    const ms = performance.now() - t0;
    await client.query("ROLLBACK");
    const ok = ms <= budgetMs;
    return {
      id: "perf_persist_card",
      ok,
      ms,
      detail: ok
        ? `persist card ${ms.toFixed(2)}ms ≤ ${budgetMs}ms`
        : `persist card ${ms.toFixed(2)}ms > budget ${budgetMs}ms`,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    return {
      id: "perf_persist_card",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}

async function certifyClaimTiming(pool: Pool, budgetMs: number): Promise<CertCheck> {
  const ids = Array.from({ length: 20 }, () => crypto.randomUUID());
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const id of ids) {
      await client.query(
        `INSERT INTO platform.outbox_events (
           id, aggregate_type, aggregate_id, event_name, event_version, schema_version,
           payload, status, attempts, max_attempts, correlation_id, committed_at
         ) VALUES ($1,'cert','cert','CertEvent',1,1,'{}'::jsonb,'pending',0,5,'cert',now())`,
        [id],
      );
    }
    await client.query("COMMIT");

    const t0 = performance.now();
    await client.query("BEGIN");
    await client.query(
      `
      WITH cte AS (
        SELECT id FROM platform.outbox_events
        WHERE status = 'pending'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 100
      )
      UPDATE platform.outbox_events o
      SET status = 'leased', leased_by = 'cert', lease_until = now() + interval '30 seconds'
      FROM cte WHERE o.id = cte.id
      `,
    );
    await client.query("COMMIT");
    const ms = performance.now() - t0;

    await pool.query(`DELETE FROM platform.outbox_events WHERE id = ANY($1::uuid[])`, [ids]);

    const ok = ms <= budgetMs;
    return {
      id: "perf_claim_outbox",
      ok,
      ms,
      detail: ok
        ? `claim ${ms.toFixed(2)}ms ≤ ${budgetMs}ms`
        : `claim ${ms.toFixed(2)}ms > budget ${budgetMs}ms`,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    await pool.query(`DELETE FROM platform.outbox_events WHERE id = ANY($1::uuid[])`, [ids]).catch(
      () => undefined,
    );
    return {
      id: "perf_claim_outbox",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}
