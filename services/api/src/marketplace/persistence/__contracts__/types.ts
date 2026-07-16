/**
 * Shared factory for Marketplace Persistence Contract Tests.
 * Same asserts MUST run against InMemory and Postgres adapters.
 */
import type { TransactionManager, TxContext } from "../../../platform/transaction/types.js";
import type { InventoryRepository } from "../../domain/InventoryRepository.js";
import type { ListingRepository } from "../../domain/ListingRepository.js";
import type { SellerRepository } from "../../domain/SellerRepository.js";

export interface MarketplaceContractHarness {
  label: string;
  /** Unique namespace so PG slugs don't collide across runs. */
  ns: string;
  tx: TransactionManager;
  sellers: SellerRepository;
  inventory: InventoryRepository;
  listings: ListingRepository;
  teardown?: () => Promise<void>;
}

export type MarketplaceContractFactory = () => Promise<MarketplaceContractHarness>;

export async function inTx<T>(
  tx: TransactionManager,
  fn: (ctx: TxContext) => Promise<T>,
): Promise<T> {
  return tx.runInTransaction(fn);
}

/** Seed a seller (satisfies FK for inventory/listing) and return its id. */
export async function seedSeller(
  harness: MarketplaceContractHarness,
  suffix: string,
): Promise<string> {
  const created = await inTx(harness.tx, (tx) =>
    harness.sellers.upsert(tx, {
      displayName: `Seller ${suffix}`,
      slug: `${harness.ns}-${suffix}`,
    }),
  );
  return created.entity.id;
}
