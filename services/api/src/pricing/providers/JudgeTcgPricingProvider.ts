import type { PostgresPricingRepository } from "../persistence/PostgresPricingRepository.js";
import type { PriceQuoteDTO, PricingProvider, PricingSyncContext } from "../domain/types.js";

/** Mercado interno — lê seller_products / listings locais. */
export class JudgeTcgPricingProvider implements PricingProvider {
  readonly marketCode = "JUDGETCG" as const;

  constructor(private readonly repo: PostgresPricingRepository) {}

  async syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[] }> {
    const quote = await this.repo.loadInternalOffers(ctx.subjectType, ctx.subjectId);
    return { ok: true, quotes: quote ? [quote] : [] };
  }
}
