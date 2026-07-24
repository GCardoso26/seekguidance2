import { describe, expect, it } from "vitest";
import {
  DEFAULT_LPC_WINDOW_MS,
  LPC_INVARIANTS,
  analyzeSellerConcentration,
  computeDemandConcentration50,
  computeLiquidityCoverageScore,
  computeLiquidityProofCount,
  computeSupplyDepth,
  deriveLiquidityProofs,
  satisfiesLpcInvariant001,
  satisfiesLpcInvariant002,
  summarizeLiquidityProofTrend,
  type LiquidityAnalyticsEvent,
} from "../liquidityProof";

describe("LPC analytics spec", () => {
  it("exporta as cinco invariantes congeladas", () => {
    expect(LPC_INVARIANTS).toEqual([
      "R1-LPC-001",
      "R1-LPC-002",
      "R1-LPC-003",
      "R1-LPC-004",
      "R1-LPC-005",
    ]);
    expect(DEFAULT_LPC_WINDOW_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("Liquidity Coverage Score (LCS)", () => {
  it("calcula cobertura da watchlist", () => {
    const lcs = computeLiquidityCoverageScore({
      watchlistCardIds: ["a", "b", "c", "d", "e"],
      cardIdsWithOffer: ["a", "b", "c", "x"],
    });
    expect(lcs).toBe(0.6);
  });
});

describe("Supply Depth (SD)", () => {
  it("usa mediana e não é distorcida por outlier", () => {
    expect(computeSupplyDepth([1, 1, 1, 1, 300])).toBe(1);
    expect(computeSupplyDepth([80, 80, 80, 80, 80])).toBe(80);
  });
});

describe("Invariantes LPC", () => {
  it("R1-LPC-001 exige sellerId != buyerId", () => {
    expect(satisfiesLpcInvariant001("A", "B")).toBe(true);
    expect(satisfiesLpcInvariant001("A", "A")).toBe(false);
  });

  it("R1-LPC-002 exige offerCount explícito >= 1", () => {
    expect(satisfiesLpcInvariant002(1)).toBe(true);
    expect(satisfiesLpcInvariant002(0)).toBe(false);
    expect(satisfiesLpcInvariant002(undefined)).toBe(false);
  });
});

describe("Liquidity Proof Count (LPC)", () => {
  const base: LiquidityAnalyticsEvent[] = [
    {
      name: "seller_listing_published",
      at: "2026-07-01T10:00:00.000Z",
      props: { cardId: "lor_rapunzel_gifted", listingId: "L1", userId: "seller-A" },
    },
    {
      name: "buyer_card_open",
      at: "2026-07-01T11:00:00.000Z",
      props: { cardId: "lor_rapunzel_gifted", userId: "buyer-B" },
    },
    {
      name: "buyer_offers_viewed",
      at: "2026-07-01T11:01:00.000Z",
      props: { cardId: "lor_rapunzel_gifted", userId: "buyer-B", offerCount: 2 },
    },
    {
      name: "buyer_add_to_cart",
      at: "2026-07-01T11:02:00.000Z",
      props: { cardId: "lor_rapunzel_gifted", listingId: "L1", userId: "buyer-B" },
    },
  ];

  it("deriva proof quando todas as invariantes passam", () => {
    const proofs = deriveLiquidityProofs(base);
    expect(proofs).toHaveLength(1);
    expect(summarizeLiquidityProofTrend(proofs)).toEqual({
      lpc: 1,
      distinctSellers: 1,
      distinctBuyers: 1,
    });
  });

  it("R1-LPC-001: ignora self-buy", () => {
    const selfBuy = base.map((e) =>
      e.name.startsWith("buyer_")
        ? { ...e, props: { ...e.props, userId: "seller-A" } }
        : e,
    );
    expect(computeLiquidityProofCount(selfBuy)).toBe(0);
  });

  it("R1-LPC-002: ignora offerCount ausente ou zero", () => {
    const missing = base.map((e) =>
      e.name === "buyer_offers_viewed"
        ? { ...e, props: { cardId: "lor_rapunzel_gifted", userId: "buyer-B" } }
        : e,
    );
    const zero = base.map((e) =>
      e.name === "buyer_offers_viewed"
        ? { ...e, props: { ...e.props, offerCount: 0 } }
        : e,
    );
    expect(computeLiquidityProofCount(missing)).toBe(0);
    expect(computeLiquidityProofCount(zero)).toBe(0);
  });

  it("R1-LPC-003: ignora cart antes de offers", () => {
    const badOrder: LiquidityAnalyticsEvent[] = [
      base[0]!,
      base[1]!,
      {
        name: "buyer_add_to_cart",
        at: "2026-07-01T11:00:30.000Z",
        props: { cardId: "lor_rapunzel_gifted", userId: "buyer-B" },
      },
      {
        name: "buyer_offers_viewed",
        at: "2026-07-01T11:01:00.000Z",
        props: { cardId: "lor_rapunzel_gifted", userId: "buyer-B", offerCount: 1 },
      },
    ];
    expect(computeLiquidityProofCount(badOrder)).toBe(0);
  });

  it("R1-LPC-004: ignora cardId divergente no cart", () => {
    const otherCard = base.map((e) =>
      e.name === "buyer_add_to_cart"
        ? { ...e, props: { ...e.props, cardId: "other_card" } }
        : e,
    );
    expect(computeLiquidityProofCount(otherCard)).toBe(0);
  });

  it("R1-LPC-005: ignora fora da janela de 7 dias", () => {
    const late = base.map((e) =>
      e.name === "buyer_add_to_cart"
        ? { ...e, at: "2026-07-20T11:02:00.000Z" }
        : e.name.startsWith("buyer_")
          ? { ...e, at: e.at.replace("2026-07-01", "2026-07-20") }
          : e,
    );
    expect(computeLiquidityProofCount(late)).toBe(0);
  });
});

describe("Seller Concentration (SCI)", () => {
  it("distingue 1 loja dominante de distribuição saudável", () => {
    const concentrated = analyzeSellerConcentration([
      { sellerId: "A", listingCount: 180 },
      { sellerId: "B", listingCount: 70 },
      { sellerId: "C", listingCount: 20 },
      { sellerId: "D", listingCount: 15 },
      { sellerId: "E", listingCount: 15 },
    ]);
    expect(concentrated.sci).toBe(60);
    expect(concentrated.top1Share).toBeCloseTo(180 / 300, 5);
    expect(concentrated.skewed).toBe(true);

    const healthy = analyzeSellerConcentration([
      { sellerId: "a", listingCount: 25 },
      { sellerId: "b", listingCount: 18 },
      { sellerId: "c", listingCount: 16 },
      { sellerId: "d", listingCount: 14 },
      { sellerId: "e", listingCount: 12 },
    ]);
    expect(healthy.sci).toBe(17);
    expect(healthy.skewed).toBe(false);
    expect(healthy.top1Share).toBeLessThan(0.35);
  });
});

describe("Demand Concentration (DC50)", () => {
  it("encontra o menor N que cobre 50% das buscas", () => {
    const { dc50, topCardIds } = computeDemandConcentration50({
      rapunzel: 40,
      belle: 20,
      diablo: 15,
      prepared: 10,
      other1: 5,
      other2: 5,
      other3: 5,
    });
    expect(dc50).toBe(2);
    expect(topCardIds[0]).toBe("rapunzel");
  });
});
