import { describe, expect, it } from "vitest";
import { BUYER_BENCHMARK, buyerBenchmarkScore } from "@/lib/buyer-benchmark";
import { smartCartMock, buyerDashboardMock, buyerInsightsMock } from "@/lib/buyer-experience-mock";
import { collectionStats, estimateCollectionValueCents } from "@/lib/collection";

describe("buyer-benchmark", () => {
  it("covers all dimensions without behind status", () => {
    const dims = Object.keys(BUYER_BENCHMARK);
    expect(dims.length).toBeGreaterThanOrEqual(10);
    const score = buyerBenchmarkScore();
    expect(score.behind).toBe(0);
    expect(score.ahead + score.parity).toBe(dims.length);
  });
});

describe("buyer-experience-mock", () => {
  it("dashboard has core sections", () => {
    const dash = buyerDashboardMock();
    expect(dash.orders).toBeTruthy();
    expect(dash.wishlist.total).toBeGreaterThanOrEqual(0);
    expect(dash.collection.unique_cards).toBeGreaterThan(0);
    expect(Array.isArray(dash.recommended)).toBe(true);
  });

  it("insights never auto-buy", () => {
    const ins = buyerInsightsMock();
    expect(ins.policy?.never_auto_buy).toBe(true);
    expect(ins.insights.length).toBeGreaterThan(0);
  });

  it("smart cart returns strategies", () => {
    const cart = smartCartMock("best_value");
    expect(cart.summary.store_count).toBeGreaterThan(0);
    expect(cart.strategies.some((s) => s.selected)).toBe(true);
  });
});

describe("collection stats", () => {
  it("counts duplicates and value", () => {
    const items = [
      {
        id: "1",
        card_id: "c1",
        quantity: 3,
        condition: "NM",
        is_foil: false,
        card: { name: "Sol Ring", game_code: "MTG", lowestPrice: 100 },
      },
      {
        id: "2",
        card_id: "c2",
        quantity: 1,
        condition: "NM",
        is_foil: true,
        card: { name: "Tower", game_code: "MTG", lowestPrice: 50 },
      },
    ];
    const stats = collectionStats(items as never);
    expect(stats.totalCards).toBe(4);
    expect(stats.duplicates).toBe(2);
    expect(stats.foilCount).toBe(1);
    expect(estimateCollectionValueCents(items as never)).toBe(350);
  });
});
