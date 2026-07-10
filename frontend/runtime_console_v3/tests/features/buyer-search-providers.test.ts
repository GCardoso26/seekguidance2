import { describe, expect, it } from "vitest";
import { ALL_SEARCH_PROVIDERS } from "@/features/search/providers/registry";

describe("search everywhere sprint 14", () => {
  it("registers buyer providers", () => {
    const ids = ALL_SEARCH_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("wishlist");
    expect(ids).toContain("buyer-orders");
    expect(ids).toContain("decks");
    expect(ids).toContain("collection");
    expect(ids).toContain("favorite-stores");
  });
});
