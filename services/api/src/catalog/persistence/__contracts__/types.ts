/**
 * Shared factory for Persistence Contract Tests.
 * Same asserts MUST run against InMemory and Postgres adapters.
 */
import type { TransactionManager, TxContext } from "../../../platform/transaction/types.js";
import type { CatalogCardRepository } from "../../domain/CatalogCardRepository.js";
import type { CatalogSetRepository } from "../../domain/CatalogSetRepository.js";
import type { CatalogVariantRepository } from "../../domain/CatalogVariantRepository.js";
import type { ProviderMappingRepository } from "../../domain/ProviderMappingRepository.js";

export interface ContractHarness {
  label: string;
  tx: TransactionManager;
  /** Stable game id seeded for FK-safe writes. */
  gameId: string;
  cards: CatalogCardRepository;
  sets: CatalogSetRepository;
  variants: CatalogVariantRepository;
  mappings: ProviderMappingRepository;
  /** Optional cleanup after suite. */
  teardown?: () => Promise<void>;
}

export type ContractFactory = () => Promise<ContractHarness>;

/** Helper: run work inside TX and return result. */
export async function inTx<T>(
  tx: TransactionManager,
  fn: (ctx: TxContext) => Promise<T>,
): Promise<T> {
  return tx.runInTransaction(fn);
}
