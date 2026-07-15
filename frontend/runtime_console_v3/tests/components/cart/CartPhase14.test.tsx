/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { getListingProductId, isListingPurchasable } from "@/lib/listing-utils";
import type { CardListing } from "@/types/card";

const BASE: CardListing = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  cardId: "abc",
  sellerId: "s1",
  sellerName: "Loja",
  sellerReputation: 4.5,
  condition: "NM",
  price: 10,
  currency: "BRL",
  quantity: 2,
  foil: false,
  language: "pt",
  createdAt: "2026-01-01",
};

describe("listing-utils", () => {
  it("identifica productId explícito", () => {
    expect(getListingProductId({ ...BASE, productId: "prod-1" })).toBe("prod-1");
  });

  it("rejeita ofertas de referência market-", () => {
    expect(getListingProductId({ ...BASE, id: "market-NM-0-scryfall" })).toBeNull();
    expect(isListingPurchasable({ ...BASE, id: "market-NM-0-scryfall" })).toBe(false);
  });

  it("exige productId explícito (não usa listing.id)", () => {
    expect(getListingProductId(BASE)).toBeNull();
    expect(isListingPurchasable(BASE)).toBe(false);
    expect(isListingPurchasable({ ...BASE, productId: "550e8400-e29b-41d4-a716-446655440000" })).toBe(
      true,
    );
  });
});

describe("cartStore", () => {
  it("exporta useCartStore", async () => {
    const { useCartStore } = await import("@/stores/cartStore");
    expect(useCartStore.getState().isOpen).toBe(false);
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);
  });
});
