/**
 * Shared factory for Identity Persistence Contract Tests.
 * Same asserts MUST run against InMemory and Postgres adapters.
 */
import type { TransactionManager, TxContext } from "../../../platform/transaction/types.js";
import type { RoleAssignmentRepository } from "../../domain/RoleAssignmentRepository.js";
import type { SellerProfileRepository } from "../../domain/SellerProfileRepository.js";
import type { SessionRepository } from "../../domain/SessionRepository.js";
import type { UserRepository } from "../../domain/UserRepository.js";

export interface IdentityContractHarness {
  label: string;
  /** Unique namespace so PG emails don't collide across runs. */
  ns: string;
  tx: TransactionManager;
  users: UserRepository;
  profiles: SellerProfileRepository;
  sessions: SessionRepository;
  roles: RoleAssignmentRepository;
  teardown?: () => Promise<void>;
}

export type IdentityContractFactory = () => Promise<IdentityContractHarness>;

export async function inTx<T>(
  tx: TransactionManager,
  fn: (ctx: TxContext) => Promise<T>,
): Promise<T> {
  return tx.runInTransaction(fn);
}

/** Seed a user (satisfies FK for sessions/roles/profiles) and return its id. */
export async function seedUser(
  h: IdentityContractHarness,
  suffix: string,
): Promise<string> {
  const created = await inTx(h.tx, (tx) =>
    h.users.upsert(tx, { email: `${h.ns}-${suffix}@example.com`, displayName: `U ${suffix}` }),
  );
  return created.entity.id;
}
