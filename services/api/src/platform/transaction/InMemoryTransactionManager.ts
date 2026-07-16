import type { MemoryTxContext, TransactionManager, TxContext } from "./types.js";

/** In-memory stores that participate in TX snapshot/rollback. */
export interface TxParticipant {
  beginTx(txId: string): void;
  commitTx(txId: string): void;
  rollbackTx(txId: string): void;
}

/**
 * In-memory TX for unit tests.
 * Does not know about Outbox — Application wires participants (repos + outbox).
 */
export class InMemoryTransactionManager implements TransactionManager {
  private seq = 0;
  private readonly participants: TxParticipant[];

  constructor(participants: TxParticipant[] = []) {
    this.participants = [...participants];
  }

  addParticipant(participant: TxParticipant): void {
    this.participants.push(participant);
  }

  async runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    const tx: MemoryTxContext = {
      id: `mem-tx-${++this.seq}`,
      kind: "memory",
    };
    for (const p of this.participants) p.beginTx(tx.id);
    try {
      const result = await fn(tx);
      for (const p of this.participants) p.commitTx(tx.id);
      return result;
    } catch (err) {
      for (const p of [...this.participants].reverse()) p.rollbackTx(tx.id);
      throw err;
    }
  }
}
