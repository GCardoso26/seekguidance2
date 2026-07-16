import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { UserRepository } from "../domain/UserRepository.js";
import { normalizeEmail, type User, type UserUpsert } from "../domain/models.js";

export class InMemoryUserRepository implements UserRepository, TxParticipant {
  private rows = new Map<string, User>();
  private snapshots = new Map<string, Map<string, User>>();

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

  async upsert(_tx: TxContext, input: UserUpsert): Promise<RepositoryResult<User>> {
    const now = getClock().now();
    const email = normalizeEmail(input.email);
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      [...this.rows.values()].find((u) => u.email === email);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:user:${existing.id}`);
    }

    const next: User = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      email,
      displayName: input.displayName,
      emailVerified: input.emailVerified ?? existing?.emailVerified ?? false,
      passwordHash:
        input.passwordHash !== undefined ? input.passwordHash : existing?.passwordHash ?? null,
      status: input.status ?? existing?.status ?? "active",
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (sameUser(existing, next)) {
      return {
        outcome: "unchanged",
        entity: structuredClone(existing),
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    this.rows.set(next.id, next);
    return {
      outcome: "updated",
      entity: structuredClone(next),
      previousVersion: existing.rowVersion,
      currentVersion: next.rowVersion,
    };
  }

  async findById(_tx: TxContext, id: string): Promise<User | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByEmail(_tx: TxContext, email: string): Promise<User | null> {
    const norm = normalizeEmail(email);
    const row = [...this.rows.values()].find((u) => u.email === norm);
    return row ? structuredClone(row) : null;
  }
}

function sameUser(a: User, b: User): boolean {
  return (
    a.email === b.email &&
    a.displayName === b.displayName &&
    a.emailVerified === b.emailVerified &&
    (a.passwordHash ?? null) === (b.passwordHash ?? null) &&
    a.status === b.status
  );
}

function cloneMap(src: Map<string, User>): Map<string, User> {
  const out = new Map<string, User>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
