import { describe, expect, it, vi } from "vitest";
import {
  buildCollectionIntelligence,
  buildDeckIntelligence,
  buildMarketplaceSellerIntelligence,
} from "@/lib/intelligence/providers";

describe("Epic 11 Intelligence providers", () => {
  it("builds collection insights from public BFF fallbacks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          valueChange30d: 218,
          risingCount: 17,
          highDemandCount: 3,
        }),
      })),
    );
    const items = await buildCollectionIntelligence();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.id.includes("value") || i.title.toLowerCase().includes("valoriz"))).toBe(
      true,
    );
    vi.unstubAllGlobals();
  });

  it("builds deck intelligence with completion and buy-all CTA", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          owned_pct: 92,
          missing_count: 4,
          min_cost: 120,
          avg_cost: 180,
          savings: 40,
        }),
      })),
    );
    const items = await buildDeckIntelligence("deck-1");
    expect(items.some((i) => i.id === "deck-owned")).toBe(true);
    expect(items.find((i) => i.id === "deck-owned")?.ctaLabel).toBe("Comprar tudo");
    vi.unstubAllGlobals();
  });

  it("builds marketplace seller intelligence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          idealPrice: 12.5,
          liquidity: "alta",
          competition: 8,
          velocity: "média",
        }),
      })),
    );
    const items = await buildMarketplaceSellerIntelligence();
    expect(Array.isArray(items)).toBe(true);
    vi.unstubAllGlobals();
  });
});
