import type { PriceQuoteDTO, PricingProvider, PricingSyncContext } from "../domain/types.js";

export class CardTraderPricingProvider implements PricingProvider {
  readonly marketCode = "CARDTRADER" as const;

  async syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[]; error?: string }> {
    if (!process.env.CARDTRADER_TOKEN) {
      return { ok: true, quotes: [] };
    }
    void ctx;
    return { ok: true, quotes: [], error: "cardtrader_http_not_wired" };
  }
}
