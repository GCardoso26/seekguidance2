import type { PriceQuoteDTO, PricingProvider, PricingSyncContext } from "../domain/types.js";

/** Stub — integra via API key TCGPLAYER_API_KEY quando disponível. */
export class TcgPlayerPricingProvider implements PricingProvider {
  readonly marketCode = "TCGPLAYER" as const;

  async syncPrices(ctx: PricingSyncContext): Promise<{ ok: boolean; quotes: PriceQuoteDTO[]; error?: string }> {
    if (!process.env.TCGPLAYER_API_KEY) {
      return { ok: true, quotes: [] };
    }
    void ctx;
    // Placeholder: real HTTP client wired when credentials exist
    return { ok: true, quotes: [], error: "tcgplayer_http_not_wired" };
  }
}
