import type { PriceQuoteDTO, PricingProvider, PricingSyncContext } from "../domain/types.js";

export class EbayPricingProvider implements PricingProvider {
  readonly marketCode = "EBAY" as const;

  async syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[]; error?: string }> {
    if (!process.env.EBAY_APP_ID) {
      return { ok: true, quotes: [] };
    }
    void ctx;
    return { ok: true, quotes: [], error: "ebay_http_not_wired" };
  }
}
