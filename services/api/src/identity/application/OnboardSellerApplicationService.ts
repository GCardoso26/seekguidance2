import type { TransactionManager } from "../../platform/transaction/types.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { SellerRepository } from "../../marketplace/domain/SellerRepository.js";
import type { Seller } from "../../marketplace/domain/models.js";
import type { SellerProfile } from "../domain/models.js";
import { slugify } from "../../marketplace/domain/models.js";

export interface OnboardSellerInput {
  userId: string;
  displayName: string;
  slug?: string;
}

export interface OnboardSellerResult {
  seller: Seller;
  profile: SellerProfile;
}

/**
 * Seller onboarding — Identity ≠ Marketplace (separate TXs).
 * Flow: CreateSeller → SellerProfile → AssignRole(seller).
 * Register is a separate step. Never mixes user signup with shop creation.
 */
export class OnboardSellerApplicationService {
  constructor(
    private readonly marketplaceTx: TransactionManager,
    private readonly identityTx: TransactionManager,
    private readonly sellers: SellerRepository,
    private readonly profiles: SellerProfileRepository,
    private readonly roles: RoleAssignmentRepository,
  ) {}

  async execute(input: OnboardSellerInput): Promise<OnboardSellerResult> {
    const existing = await this.identityTx.runInTransaction((t) =>
      this.profiles.findByUserId(t, input.userId),
    );
    if (existing) {
      const seller = await this.marketplaceTx.runInTransaction((t) =>
        this.sellers.findById(t, existing.sellerId),
      );
      if (!seller) throw new Error("seller_missing_for_profile");
      return { seller, profile: existing };
    }

    const slug = input.slug ? slugify(input.slug) : slugify(input.displayName);

    const sellerResult = await this.marketplaceTx.runInTransaction((txCtx) =>
      this.sellers.upsert(txCtx, {
        displayName: input.displayName,
        slug,
        status: "active",
      }),
    );

    const profileResult = await this.identityTx.runInTransaction(async (txCtx) => {
      const profile = await this.profiles.upsert(txCtx, {
        userId: input.userId,
        sellerId: sellerResult.entity.id,
      });
      await this.roles.assign(txCtx, input.userId, "seller");
      return profile;
    });

    return { seller: sellerResult.entity, profile: profileResult.entity };
  }
}
