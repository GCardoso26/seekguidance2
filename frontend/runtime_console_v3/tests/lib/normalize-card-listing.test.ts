import { describe, expect, it } from "vitest";
import { normalizeCardListing, sellerInitial } from "@/lib/normalize-card-listing";

describe("normalizeCardListing", () => {
  it("mapeia storeName → sellerName quando a API omite sellerName", () => {
    const listing = normalizeCardListing(
      {
        id: "d11687ae-ca05-4ef0-8367-73fd765474f4",
        cardId: "2a887bdd-2cde-4c17-9a2d-9ac1106cf6ea",
        sellerId: "19c48c72-559e-43f5-817d-c1287aea0251",
        storeId: "19c48c72-559e-43f5-817d-c1287aea0251",
        storeName: "Lojinha 1",
        price: 10,
        condition: "NM",
        currency: "BRL",
        quantity: 1,
      },
      "2a887bdd-2cde-4c17-9a2d-9ac1106cf6ea",
    );

    expect(listing.sellerName).toBe("Lojinha 1");
    expect(listing.sellerReputation).toBe(4.5);
    expect(listing.productId).toBe(listing.id);
    expect(sellerInitial(listing.sellerName)).toBe("L");
  });

  it("sellerInitial tolera null/undefined", () => {
    expect(sellerInitial(undefined)).toBe("?");
    expect(sellerInitial(null)).toBe("?");
    expect(sellerInitial("")).toBe("?");
  });
});
