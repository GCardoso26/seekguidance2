import { describe, expect, it } from "vitest";
import { defaultActivityFeedProvider } from "@/lib/profile-activity";

describe("Social activity feed projection", () => {
  it("builds activity from public projections", () => {
    const items = defaultActivityFeedProvider.buildFromProjections({
      recentDecks: [{ id: "d1", name: "Aggro", isPublic: true, updatedAt: "2026-07-01T00:00:00Z" }],
      wishlistAlerts: [{ id: "a1", title: "Preço caiu", triggeredAt: "2026-07-02T00:00:00Z" }],
      recentOrders: [{ id: "o1", store_name: "Loja X", created_at: "2026-07-03T00:00:00Z" }],
    });
    expect(items.some((i) => i.kind === "deck_publish")).toBe(true);
    expect(items.some((i) => i.kind === "wishlist_price_drop")).toBe(true);
    expect(items.some((i) => i.kind === "purchase")).toBe(true);
  });
});
