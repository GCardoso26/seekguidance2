import type { Pool } from "pg";
import { PostgresTransactionManager } from "../platform/transaction/PostgresTransactionManager.js";
import { PostgresOutboxRepository } from "../platform/outbox/PostgresOutboxRepository.js";
import { createMarketplaceApplicationServices } from "./application/createMarketplaceApplicationServices.js";
import { PostgresInventoryRepository } from "./persistence/PostgresInventoryRepository.js";
import { PostgresListingRepository } from "./persistence/PostgresListingRepository.js";
import { PostgresSellerRepository } from "./persistence/PostgresSellerRepository.js";
import { RepositoryMarketplaceQueryService } from "./read/MarketplaceQueryService.js";

/**
 * Composition root — Postgres adapters for Marketplace (Sprint 4.2).
 * Mirrors createPostgresCatalogStack. No domain rules here.
 */
export function createPostgresMarketplaceStack(pool: Pool) {
  const tx = new PostgresTransactionManager(pool);
  const sellers = new PostgresSellerRepository();
  const inventory = new PostgresInventoryRepository();
  const listings = new PostgresListingRepository();
  const outbox = new PostgresOutboxRepository(pool);

  const apps = createMarketplaceApplicationServices({ tx, sellers, inventory, listings, outbox });

  return {
    pool,
    tx,
    sellers,
    inventory,
    listings,
    outbox,
    apps,
    queries: new RepositoryMarketplaceQueryService(tx, sellers, listings),
  };
}

export type PostgresMarketplaceStack = ReturnType<typeof createPostgresMarketplaceStack>;
