import type { Pool } from "pg";
import { PostgresTransactionManager } from "../../platform/transaction/PostgresTransactionManager.js";
import { PostgresOutboxRepository } from "../../platform/outbox/PostgresOutboxRepository.js";
import { createCatalogApplicationServices } from "../application/createCatalogApplicationServices.js";
import { PostgresCatalogCardRepository } from "./PostgresCatalogCardRepository.js";
import { PostgresCatalogSetRepository } from "./PostgresCatalogSetRepository.js";
import { PostgresCatalogVariantRepository } from "./PostgresCatalogVariantRepository.js";
import { PostgresProviderMappingRepository } from "./PostgresProviderMappingRepository.js";

/**
 * Composition root helper — wires Postgres adapters for Catalog.
 * No domain rules; workers/scripts call this to obtain AS + repos + TX.
 */
export function createPostgresCatalogStack(pool: Pool) {
  const tx = new PostgresTransactionManager(pool);
  const sets = new PostgresCatalogSetRepository();
  const cards = new PostgresCatalogCardRepository();
  const variants = new PostgresCatalogVariantRepository();
  const mappings = new PostgresProviderMappingRepository();
  const outbox = new PostgresOutboxRepository(pool);

  const apps = createCatalogApplicationServices({
    tx,
    sets,
    cards,
    variants,
    mappings,
    outbox,
  });

  return {
    pool,
    tx,
    sets,
    cards,
    variants,
    mappings,
    outbox,
    apps,
  };
}

export type PostgresCatalogStack = ReturnType<typeof createPostgresCatalogStack>;
