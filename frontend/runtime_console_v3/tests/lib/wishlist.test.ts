import { describe, expect, it } from "vitest";
import {
  invalidateWishlistQueryKeys,
  normalizeWishlistResponse,
  wishlistIdSet,
  wishlistToggleAction,
  WISHLIST_QUERY_KEY,
} from "@/lib/wishlist";

describe("wishlistToggleAction", () => {
  it("retorna remove quando já salvo", () => {
    expect(wishlistToggleAction(true)).toBe("remove");
  });

  it("retorna add quando não salvo", () => {
    expect(wishlistToggleAction(false)).toBe("add");
  });
});

describe("wishlistIdSet", () => {
  it("monta set de product_ids", () => {
    const set = wishlistIdSet([
      {
        product_id: "a",
        added_at: "2026-01-01",
        product: { id: "a", name: "A", category: "booster", price_cents: 100 },
      },
      {
        product_id: "b",
        added_at: "2026-01-02",
        product: { id: "b", name: "B", category: "sleeve", price_cents: 200 },
      },
    ]);
    expect(set.has("a")).toBe(true);
    expect(set.has("b")).toBe(true);
    expect(set.size).toBe(2);
  });
});

describe("normalizeWishlistResponse", () => {
  it("normaliza payload da API", () => {
    const result = normalizeWishlistResponse({
      items: [
        {
          product_id: "p1",
          added_at: "2026-06-01",
          product: { id: "p1", name: "X", category: "booster", price_cents: 500 },
        },
      ],
      total: 1,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.product_id).toBe("p1");
  });
});

describe("invalidateWishlistQueryKeys", () => {
  it("inclui WISHLIST_QUERY_KEY para cache invalidation", () => {
    const keys = invalidateWishlistQueryKeys();
    expect(keys[0]).toEqual(WISHLIST_QUERY_KEY);
  });
});
