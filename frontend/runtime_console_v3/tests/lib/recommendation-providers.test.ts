import { describe, expect, it } from "vitest";
import {
  defaultCollectionAdvisor,
  defaultDeckAdvisor,
  defaultMarketplaceAdvisor,
  defaultMetaAdvisor,
  defaultRecommendationProvider,
} from "@/lib/recommendations/providers";

describe("Recommendation Engine providers", () => {
  it("exposes decoupled advisor interfaces with public API fallbacks", async () => {
    const collection = await defaultCollectionAdvisor.advise({});
    expect(collection.length).toBeGreaterThan(0);
    expect(collection[0].title).toBeTruthy();

    const deck = await defaultDeckAdvisor.advise({});
    expect(deck[0].href).toContain("/decks");

    const mkt = await defaultMarketplaceAdvisor.advise({});
    expect(mkt.length).toBeGreaterThan(0);

    const meta = await defaultMetaAdvisor.advise({ cardId: "x" });
    expect(meta[0].href).toContain("/cards/");

    const bundle = await defaultRecommendationProvider.recommend({});
    expect(bundle.length).toBeGreaterThan(0);
  });
});
