import type { PriceQuoteDTO, PricingProvider, PricingSyncContext } from "../domain/types.js";

export class CardmarketPricingProvider implements PricingProvider {
  readonly marketCode = "CARDMARKET" as const;

  async syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[]; error?: string }> {
    if (!process.env.CARDMARKET_APP_TOKEN) {
      return { ok: true, quotes: [] };
    }
    void ctx;
    return { ok: true, quotes: [], error: "cardmarket_http_not_wired" };
  }
}
