import type { PoolClient } from "pg";

/**
 * Explicit transactional context passed to repositories.
 * TransactionManager owns begin/commit/rollback; repositories never open connections.
 */
export interface TxContext {
  readonly id: string;
  readonly kind: "memory" | "postgres";
}

export interface MemoryTxContext extends TxContext {
  readonly kind: "memory";
}

export interface PostgresTxContext extends TxContext {
  readonly kind: "postgres";
  readonly client: PoolClient;
}

export interface TransactionManager {
  /**
   * Runs `fn` inside a single transaction.
   * Commits on success; rolls back if `fn` throws.
   * Does NOT know about Outbox or domain events — Application Service decides writes.
   */
  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T>;
}

export function requirePostgresClient(tx: TxContext): PoolClient {
  if (tx.kind !== "postgres") {
    throw new Error(`tx_requires_postgres:got_${tx.kind}`);
  }
  return (tx as PostgresTxContext).client;
}

export function isMemoryTx(tx: TxContext): tx is MemoryTxContext {
  return tx.kind === "memory";
}
