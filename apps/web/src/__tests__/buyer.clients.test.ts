import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/src/api/client";
import { createPublicApiClient } from "@/src/api/public.client";
import { createMarketplaceApiClient } from "@/src/api/marketplace.client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("PublicApiClient.search", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envia query corretamente", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        hits: [],
        estimatedTotal: 0,
        tookMs: 1,
        query: "Lightning",
        projection: "search",
      }),
    );

    const api = createPublicApiClient(createHttpClient());
    await api.search({ q: "Lightning Bolt", limit: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/v1\/search\?/),
      expect.objectContaining({ method: "GET" }),
    );
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain("q=Lightning");
    expect(url).toContain("limit=10");
  });
});

describe("MarketplaceApiClient.getOffers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("busca ofertas no endpoint de card offers", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        catalogCardId: "card_123",
        offerCount: 1,
        bestPriceCents: 2000,
        currency: "BRL",
        offers: [
          {
            id: "listing-1",
            sellerId: "seller-1",
            catalogCardId: "card_123",
            catalogVariantId: "var-1",
            priceCents: 2000,
            currency: "BRL",
            condition: "NM",
            language: "en",
            finish: null,
            notes: null,
            quantity: 1,
            status: "active",
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    );

    const api = createMarketplaceApiClient(createHttpClient());
    const res = await api.getOffers("card_123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/marketplace/cards/card_123/offers",
      expect.objectContaining({ method: "GET" }),
    );
    expect(res.offerCount).toBe(1);
    expect(res.offers[0]!.priceCents).toBe(2000);
  });
});
