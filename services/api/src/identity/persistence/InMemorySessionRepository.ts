import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { SessionRepository } from "../domain/SessionRepository.js";
import type { CreateSessionInput, Session } from "../domain/models.js";

export class InMemorySessionRepository implements SessionRepository, TxParticipant {
  private rows = new Map<string, Session>();
  private snapshots = new Map<string, Map<string, Session>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  async create(_tx: TxContext, input: CreateSessionInput): Promise<Session> {
    const now = getClock().now();
    const session: Session = {
      id: input.id ?? getIdGenerator().generate(),
      userId: input.userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + input.ttlMs),
      revokedAt: null,
    };
    this.rows.set(session.id, session);
    return structuredClone(session);
  }

  async findById(_tx: TxContext, id: string): Promise<Session | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async revoke(_tx: TxContext, id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row && row.revokedAt == null) {
      row.revokedAt = getClock().now();
      this.rows.set(id, row);
    }
  }

  async listByUser(_tx: TxContext, userId: string): Promise<Session[]> {
    return [...this.rows.values()]
      .filter((s) => s.userId === userId)
      .map((s) => structuredClone(s));
  }
}

function cloneMap(src: Map<string, Session>): Map<string, Session> {
  const out = new Map<string, Session>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
