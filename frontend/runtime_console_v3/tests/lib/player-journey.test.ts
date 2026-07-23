import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateAfterCollectionMutation,
  invalidateAfterPurchase,
  invalidateAfterSellerSale,
  POST_PURCHASE_CONTINUITY_LINKS,
} from "@/lib/player-journey";
import { continueShoppingHref, saveJourneyContext, readJourneyContext } from "@/lib/journey-context";

function mockQc() {
  return {
    invalidateQueries: vi.fn(),
  } as unknown as QueryClient & { invalidateQueries: ReturnType<typeof vi.fn> };
}

describe("Player journey continuity", () => {
  it("invalidates purchase cascade keys", () => {
    const qc = mockQc();
    invalidateAfterPurchase(qc);
    expect(qc.invalidateQueries).toHaveBeenCalled();
    const keys = qc.invalidateQueries.mock.calls.map((c) => JSON.stringify(c[0].queryKey));
    expect(keys.some((k) => k.includes("shop-cart"))).toBe(true);
    expect(keys.some((k) => k.includes("buyer-dashboard"))).toBe(true);
    expect(keys.some((k) => k.includes("user-collection"))).toBe(true);
  });

  it("invalidates collection derived surfaces", () => {
    const qc = mockQc();
    invalidateAfterCollectionMutation(qc);
    const keys = qc.invalidateQueries.mock.calls.map((c) => JSON.stringify(c[0].queryKey));
    expect(keys.some((k) => k.includes("user-collection-insights"))).toBe(true);
    expect(keys.some((k) => k.includes("decks"))).toBe(true);
  });

  it("invalidates seller ops after sale", () => {
    const qc = mockQc();
    invalidateAfterSellerSale(qc);
    const keys = qc.invalidateQueries.mock.calls.map((c) => JSON.stringify(c[0].queryKey));
    expect(keys.some((k) => k.includes("seller-ops-v2") || k.includes("seller-orders"))).toBe(true);
  });

  it("exposes continuity CTAs after purchase", () => {
    expect(POST_PURCHASE_CONTINUITY_LINKS.some((l) => l.href === "/colecao")).toBe(true);
    expect(POST_PURCHASE_CONTINUITY_LINKS.some((l) => l.href === "/decks")).toBe(true);
    expect(POST_PURCHASE_CONTINUITY_LINKS.some((l) => l.href === "/perfil")).toBe(true);
  });
});

describe("Journey context", () => {
  it("stores and reads game continuity in sessionStorage", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    });
    saveJourneyContext({ gameSlug: "mtg", cardId: "c1", returnPath: "/mtg/cards/c1" });
    expect(readJourneyContext()?.gameSlug).toBe("mtg");
    expect(continueShoppingHref()).toBe("/mtg");
    vi.unstubAllGlobals();
  });
});
