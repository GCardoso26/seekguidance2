import type { Pool } from "pg";
import { PostgresTransactionManager } from "../platform/transaction/PostgresTransactionManager.js";
import { createIdentityApplicationServices } from "./application/createIdentityApplicationServices.js";
import { PostgresRoleAssignmentRepository } from "./persistence/PostgresRoleAssignmentRepository.js";
import { PostgresSellerProfileRepository } from "./persistence/PostgresSellerProfileRepository.js";
import { PostgresSessionRepository } from "./persistence/PostgresSessionRepository.js";
import { PostgresUserRepository } from "./persistence/PostgresUserRepository.js";
import { ScryptPasswordHasher } from "./persistence/ScryptPasswordHasher.js";

/**
 * Composition root — Postgres adapters for Identity (Sprint 4.2).
 * Domain only; JWT/RBAC HTTP surface is Sprint 4.3.
 */
export function createPostgresIdentityStack(pool: Pool) {
  const tx = new PostgresTransactionManager(pool);
  const users = new PostgresUserRepository();
  const profiles = new PostgresSellerProfileRepository();
  const sessions = new PostgresSessionRepository();
  const roles = new PostgresRoleAssignmentRepository();
  const hasher = new ScryptPasswordHasher();

  const apps = createIdentityApplicationServices({ tx, users, profiles, roles, hasher });

  return { pool, tx, users, profiles, sessions, roles, hasher, ...apps };
}

export type PostgresIdentityStack = ReturnType<typeof createPostgresIdentityStack>;
