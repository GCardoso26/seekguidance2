import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerRepository } from "../domain/SellerRepository.js";
import { slugify, type Seller, type SellerUpsert } from "../domain/models.js";

/**
 * Aggregate 1 — Seller onboarding.
 * Owns only who-sells state; never touches listings/orders/catalog.
 */
export class RegisterSellerApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly sellers: SellerRepository,
  ) {}

  async execute(input: SellerUpsert): Promise<RepositoryResult<Seller>> {
    const slug = input.slug ? slugify(input.slug) : slugify(input.displayName);
    return this.tx.runInTransaction((txCtx) =>
      this.sellers.upsert(txCtx, { ...input, slug }),
    );
  }
}
