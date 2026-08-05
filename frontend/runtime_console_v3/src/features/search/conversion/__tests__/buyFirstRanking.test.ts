import { describe, expect, it } from "vitest";
import {
  BUY_FIRST_TIER,
  EMPTY_OFFERS_MESSAGE,
  buildSearchEmptyState,
  classifyPurchaseIntent,
  kindFromOfferSignals,
  offerCountLabel,
  rankBuyFirst,
  rankCardsBuyFirst,
} from "@/features/search/conversion";

describe("classifyPurchaseIntent", () => {
  const cases: Array<[string, ReturnType<typeof classifyPurchaseIntent>]> = [
    ["Rapunzel", "single"],
    ["Charizard", "single"],
    ["Black Lotus", "single"],
    ["Dragon Shield", "accessory"],
    ["Perfect Fit", "accessory"],
    ["Playmat", "accessory"],
    ["Deck Box", "accessory"],
    ["Booster Lorcana", "sealed"],
    ["Booster Pokémon", "sealed"],
    ["booster box", "sealed"],
  ];

  it.each(cases)("%s → %s", (q, expected) => {
    expect(classifyPurchaseIntent(q)).toBe(expected);
  });
});

describe("rankBuyFirst", () => {
  it("coloca produtos com oferta antes de eventos e decks", () => {
    const ranked = rankBuyFirst([
      { id: "1", title: "Torneio Rapunzel", kind: "events" },
      { id: "2", title: "Artigo Rapunzel", kind: "articles" },
      { id: "3", title: "Deck Rapunzel", kind: "decks" },
      { id: "4", title: "Rapunzel (sem estoque)", kind: "out_of_stock_product", offerCount: 0 },
      { id: "5", title: "Rapunzel NM", kind: "available_product", offerCount: 2 },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["5", "4", "3", "2", "1"]);
    expect(ranked[0]!.kind).toBe("available_product");
    expect(BUY_FIRST_TIER[ranked[0]!.kind]).toBeLessThan(BUY_FIRST_TIER.events);
  });

  it("prioriza acessórios para query Dragon Shield", () => {
    const ranked = rankBuyFirst(
      [
        { id: "a", title: "Artigo Dragon Shield", kind: "articles" },
        { id: "b", title: "Dragon Shield Matte", kind: "accessory", offerCount: 1 },
        { id: "c", title: "Carta genérica", kind: "single" },
      ],
      { intent: "accessory" },
    );
    expect(ranked[0]!.id).toBe("b");
  });

  it("prioriza selados para Booster", () => {
    const ranked = rankBuyFirst(
      [
        { id: "e", title: "Evento booster", kind: "events" },
        { id: "s", title: "Booster Pack", kind: "sealed", offerCount: 3 },
        { id: "k", title: "Knowledge", kind: "knowledge" },
      ],
      { intent: "sealed" },
    );
    expect(ranked[0]!.kind).toBe("sealed");
  });
});

describe("rankCardsBuyFirst", () => {
  it("sobe cartas com listingCount > 0", () => {
    const ranked = rankCardsBuyFirst([
      { id: "1", name: "Charizard", listingCount: 0 },
      { id: "2", name: "Charizard ex", listingCount: 1, lowestPrice: 99 },
      { id: "3", name: "Charizard V", listingCount: 0, lowestPrice: 50 },
    ]);
    expect(ranked[0]!.id).toBe("2");
  });
});

describe("empty state", () => {
  it("nunca retorna título vazio e usa copy honesta", () => {
    const empty = buildSearchEmptyState("Rapunzel", "single");
    expect(empty.title).toBe(EMPTY_OFFERS_MESSAGE);
    expect(empty.suggestions.length).toBeGreaterThan(0);
    expect(empty.suggestions.some((s) => s.href.includes("singles") || s.href.includes("wishlist"))).toBe(
      true,
    );
  });

  it("offerCountLabel é honesto", () => {
    expect(offerCountLabel(0)).toMatch(/sem ofertas/i);
    expect(offerCountLabel(1)).toBe("1 oferta disponível");
    expect(offerCountLabel(3)).toBe("3 ofertas disponíveis");
  });
});

describe("kindFromOfferSignals", () => {
  it("mapeia estoque real sem inventar", () => {
    expect(kindFromOfferSignals({ offerCount: 2 })).toBe("available_product");
    expect(kindFromOfferSignals({ offerCount: 0, category: "single" })).toBe("single");
    expect(kindFromOfferSignals({ offerCount: 0, category: "accessory" })).toBe(
      "out_of_stock_product",
    );
  });
});
