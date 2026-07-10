import { describe, expect, it } from "vitest";
import type { CardDetailResponse, CardIntelligenceResponse } from "@/types/card";

describe("catalog intelligence contracts", () => {
  it("CardDetailResponse aceita campos opcionais Sprint 13", () => {
    const sample: CardDetailResponse = {
      card: {
        id: "1",
        game: "MTG",
        set: { name: "Alpha", code: "LEA" },
        name: "Black Lotus",
        number: "233",
        rarity: "rare",
        imageUris: {},
        language: "en",
        gameData: {},
        types: ["Artifact"],
        finishes: ["borderless"],
        erratas: [{ date: "2020-01-01", text: "Errata exemplo" }],
      },
      priceHistory: [],
      listings: [],
      relatedCards: [],
      marketSummary: {
        listedQuantity: 3,
        storeCount: 2,
        bestOffer: 100,
        currency: "BRL",
        avgPrice: 120,
        demandSignal: "high",
      },
      intelligence: {
        sellerAiHints: { suggestedPrice: 115, demand: "high", competitiveness: "high" },
        variantsCount: 4,
        staplesCount: 2,
      },
    };
    expect(sample.marketSummary?.bestOffer).toBe(100);
    expect(sample.card.finishes).toContain("borderless");
  });

  it("CardIntelligenceResponse shape", () => {
    const intel: CardIntelligenceResponse = {
      cardId: "1",
      taxonomy: { types: ["Creature"], subtypes: ["Dragon"], finishes: [] },
      related: {
        sameSet: [],
        alternatives: [],
        staples: [],
        upgrades: [],
        downgrades: [],
        frequentlyTogether: [],
        commanderHints: [],
      },
      variants: [],
      marketStats: {
        sampleCount: 10,
        minPrice: 1,
        maxPrice: 5,
        avgPrice: 3,
        daysWithData: 7,
        demandSignal: "medium",
      },
      sellerAiHints: { demand: "medium", competitiveness: "medium" },
      generatedAt: new Date().toISOString(),
      source: "catalog_intelligence_v1",
    };
    expect(intel.source).toBe("catalog_intelligence_v1");
  });
});
