import { describe } from "vitest";
import { Pool } from "pg";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { PostgresTransactionManager } from "../../../platform/transaction/PostgresTransactionManager.js";
import { PostgresInventoryRepository } from "../PostgresInventoryRepository.js";
import { PostgresListingRepository } from "../PostgresListingRepository.js";
import { PostgresSellerRepository } from "../PostgresSellerRepository.js";
import { registerInventoryRepositoryContract } from "./inventory.contract.js";
import { registerListingRepositoryContract } from "./listing.contract.js";
import { registerSellerRepositoryContract } from "./seller.contract.js";
import type { MarketplaceContractFactory } from "./types.js";

const databaseUrl = process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

/**
 * Marketplace persistence contracts [Postgres] — skipped unless DB URL is set.
 * Same asserts as InMemory. Teardown cascades via seller FK.
 */
describe.skipIf(!databaseUrl)("Marketplace persistence contracts [Postgres]", () => {
  const factory: MarketplaceContractFactory = async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const tx = new PostgresTransactionManager(pool);
    const ns = `ct-${getIdGenerator().generate().slice(0, 8)}`;
    return {
      label: "Postgres",
      ns,
      tx,
      sellers: new PostgresSellerRepository(),
      inventory: new PostgresInventoryRepository(),
      listings: new PostgresListingRepository(),
      teardown: async () => {
        try {
          // Cascade: deleting sellers removes their inventory + listings.
          await pool.query(`DELETE FROM marketplace.sellers WHERE slug LIKE $1`, [`${ns}-%`]);
        } finally {
          await pool.end();
        }
      },
    };
  };

  registerSellerRepositoryContract(factory);
  registerInventoryRepositoryContract(factory);
  registerListingRepositoryContract(factory);
});
