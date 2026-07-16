import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { SellerProfile } from "../domain/models.js";

export interface CreateSellerProfileInput {
  userId: string;
  /** Reference to the Marketplace Seller aggregate (created by Marketplace). */
  sellerId: string;
}

/**
 * The bridge Identity → Marketplace.
 * Creating a SellerProfile grants the `seller` role. Never copies Seller data.
 */
export class CreateSellerProfileApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly profiles: SellerProfileRepository,
    private readonly roles: RoleAssignmentRepository,
  ) {}

  async execute(input: CreateSellerProfileInput): Promise<RepositoryResult<SellerProfile>> {
    return this.tx.runInTransaction(async (txCtx) => {
      const result = await this.profiles.upsert(txCtx, {
        userId: input.userId,
        sellerId: input.sellerId,
      });
      await this.roles.assign(txCtx, input.userId, "seller");
      return result;
    });
  }
}
