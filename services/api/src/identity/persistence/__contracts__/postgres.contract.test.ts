import { describe } from "vitest";
import { Pool } from "pg";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { PostgresTransactionManager } from "../../../platform/transaction/PostgresTransactionManager.js";
import { PostgresRoleAssignmentRepository } from "../PostgresRoleAssignmentRepository.js";
import { PostgresSellerProfileRepository } from "../PostgresSellerProfileRepository.js";
import { PostgresSessionRepository } from "../PostgresSessionRepository.js";
import { PostgresUserRepository } from "../PostgresUserRepository.js";
import { registerRoleAssignmentRepositoryContract } from "./roleAssignment.contract.js";
import { registerSellerProfileRepositoryContract } from "./sellerProfile.contract.js";
import { registerSessionRepositoryContract } from "./session.contract.js";
import { registerUserRepositoryContract } from "./user.contract.js";
import type { IdentityContractFactory } from "./types.js";

const databaseUrl = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

/**
 * Identity persistence contracts [Postgres] — skipped unless DB URL is set.
 * Same asserts as InMemory. Teardown cascades via user FK.
 */
describe.skipIf(!databaseUrl)("Identity persistence contracts [Postgres]", () => {
  const factory: IdentityContractFactory = async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const tx = new PostgresTransactionManager(pool);
    const ns = `ct-${getIdGenerator().generate().slice(0, 8)}`;
    return {
      label: "Postgres",
      ns,
      tx,
      users: new PostgresUserRepository(),
      profiles: new PostgresSellerProfileRepository(),
      sessions: new PostgresSessionRepository(),
      roles: new PostgresRoleAssignmentRepository(),
      teardown: async () => {
        try {
          // Cascade: deleting users removes their roles, sessions, seller_profiles.
          await pool.query(`DELETE FROM identity.users WHERE email LIKE $1`, [`${ns}-%`]);
        } finally {
          await pool.end();
        }
      },
    };
  };

  registerUserRepositoryContract(factory);
  registerSellerProfileRepositoryContract(factory);
  registerSessionRepositoryContract(factory);
  registerRoleAssignmentRepositoryContract(factory);
});
