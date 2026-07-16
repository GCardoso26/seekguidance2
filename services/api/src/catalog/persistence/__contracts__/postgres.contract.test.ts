import { describe } from "vitest";
import { Pool } from "pg";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { PostgresTransactionManager } from "../../../platform/transaction/PostgresTransactionManager.js";
import { PostgresCatalogCardRepository } from "../PostgresCatalogCardRepository.js";
import { PostgresCatalogSetRepository } from "../PostgresCatalogSetRepository.js";
import { PostgresCatalogVariantRepository } from "../PostgresCatalogVariantRepository.js";
import { PostgresProviderMappingRepository } from "../PostgresProviderMappingRepository.js";
import { registerCatalogCardRepositoryContract } from "./catalogCard.contract.js";
import { registerCatalogSetRepositoryContract } from "./catalogSet.contract.js";
import { registerCatalogVariantRepositoryContract } from "./catalogVariant.contract.js";
import { registerProviderMappingRepositoryContract } from "./providerMapping.contract.js";
import type { ContractFactory } from "./types.js";

const databaseUrl =
  process.env.CONTRACT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

/**
 * Persistence contracts [Postgres] — skipped unless CONTRACT_DATABASE_URL / DATABASE_URL is set.
 * Gate before first real write: adapters MUST pass the same asserts as InMemory.
 */
describe.skipIf(!databaseUrl)("Persistence contracts [Postgres]", () => {
  const factory: ContractFactory = async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const tx = new PostgresTransactionManager(pool);
    const gameId = getIdGenerator().generate();
    const slug = `contract-${gameId.slice(0, 8)}`;
    const code = `G${gameId.replace(/-/g, "").slice(0, 8)}`;

    await pool.query(
      `
      INSERT INTO catalog.catalog_games (id, code, name, slug)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
      `,
      [gameId, code, `Contract Game ${slug}`, slug],
    );

    return {
      label: "Postgres",
      tx,
      gameId,
      cards: new PostgresCatalogCardRepository(),
      sets: new PostgresCatalogSetRepository(),
      variants: new PostgresCatalogVariantRepository(),
      mappings: new PostgresProviderMappingRepository(),
      teardown: async () => {
        try {
          await pool.query(
            `DELETE FROM catalog.provider_mappings
             WHERE catalog_card_id IN (SELECT id FROM catalog.catalog_cards WHERE game_id = $1)
                OR catalog_set_id IN (SELECT id FROM catalog.catalog_sets WHERE game_id = $1)`,
            [gameId],
          );
          await pool.query(
            `DELETE FROM catalog.catalog_variants
             WHERE card_id IN (SELECT id FROM catalog.catalog_cards WHERE game_id = $1)`,
            [gameId],
          );
          await pool.query(`DELETE FROM catalog.catalog_cards WHERE game_id = $1`, [gameId]);
          await pool.query(`DELETE FROM catalog.catalog_sets WHERE game_id = $1`, [gameId]);
          await pool.query(`DELETE FROM catalog.catalog_games WHERE id = $1`, [gameId]);
        } finally {
          await pool.end();
        }
      },
    };
  };

  registerCatalogCardRepositoryContract(factory);
  registerCatalogSetRepositoryContract(factory);
  registerCatalogVariantRepositoryContract(factory);
  registerProviderMappingRepositoryContract(factory);
});
