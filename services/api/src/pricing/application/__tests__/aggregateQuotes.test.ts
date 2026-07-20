import { describe, expect, it } from "vitest";
import { aggregateQuotes } from "../aggregateQuotes.js";
import type { PriceQuoteDTO } from "../../domain/types.js";

describe("aggregateQuotes", () => {
  it("calcula min/avg/median/suggested e spread", () => {
    const quotes: PriceQuoteDTO[] = [
      {
        marketCode: "JUDGETCG",
        currency: "BRL",
        minPriceCents: 1000,
        avgPriceCents: 1200,
        medianPriceCents: 1100,
        suggestedPriceCents: 1150,
        sellerCount: 5,
        liquidityScore: 0.5,
      },
      {
        marketCode: "TCGPLAYER",
        currency: "BRL",
        minPriceCents: 900,
        avgPriceCents: 1300,
        medianPriceCents: 1250,
        suggestedPriceCents: 1280,
        sellerCount: 20,
        liquidityScore: 0.8,
      },
    ];
    const v = aggregateQuotes("product_variant", "v1", "BRL", quotes);
    expect(v.minPriceCents).toBe(900);
    expect(v.suggestedPriceCents).toBeGreaterThan(0);
    expect(v.confidence).toBe("medium");
    expect(v.sources).toContain("JUDGETCG");
    expect(v.spreadBps).toBeGreaterThan(0);
  });
});
