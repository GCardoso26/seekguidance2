import type { Pool } from "pg";
import type { PostgresTxContext, TransactionManager, TxContext } from "./types.js";

/**
 * PostgreSQL TransactionManager — only begin/commit/rollback.
 * Does not reference Outbox or domain repositories.
 */
export class PostgresTransactionManager implements TransactionManager {
  private seq = 0;

  constructor(private readonly pool: Pool) {}

  async runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const tx: PostgresTxContext = {
      id: `pg-tx-${++this.seq}`,
      kind: "postgres",
      client,
    };
    try {
      await client.query("BEGIN");
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore rollback errors */
      }
      throw err;
    } finally {
      client.release();
    }
  }
}
