import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/src/api/client";
import { createPublicApiClient } from "@/src/api/public.client";
import {
  createMarketplaceApiClient,
  publishListingWithInventory,
} from "@/src/api/marketplace.client";
import { resolveVariantId } from "@/src/lib/resolve-variant";
import { priceReaisToCents } from "@/src/schemas/seller";
import {
  clearSellerFunnel,
  markShopCreated,
  measureTimeToFirstListingMs,
} from "@/src/auth/seller-funnel";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("seller publish helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearSellerFunnel();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSellerFunnel();
  });

  it("priceReaisToCents", () => {
    expect(priceReaisToCents(20)).toBe(2000);
    expect(priceReaisToCents(19.9)).toBe(1990);
  });

  it("resolveVariantId usa Public API variants", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        items: [
          {
            id: "card_1:foil",
            cardId: "card_1",
            finish: "foil",
            language: "en",
            name: "Bolt",
            setCode: "LEA",
            priceMin: null,
            currency: null,
            hasStock: false,
            imageUrl: null,
          },
        ],
      }),
    );
    const publicApi = createPublicApiClient(createHttpClient());
    const resolved = await resolveVariantId(publicApi, "card_1", true);
    expect(resolved.catalogVariantId).toBe("card_1:foil");
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain(
      "/api/v1/variants?cardId=card_1&finish=foil",
    );
  });

  it("publishListingWithInventory: inventory then listing", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, { id: "inv-1", quantity: 2, outcome: "created" }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: "listing-1",
          sellerId: "s1",
          catalogCardId: "card_1",
          catalogVariantId: "card_1:nonfoil",
          priceCents: 2000,
          currency: "BRL",
          condition: "NM",
          language: "en",
          finish: "nonfoil",
          notes: null,
          quantity: 2,
          status: "active",
          updatedAt: new Date().toISOString(),
        }),
      );

    const api = createMarketplaceApiClient(createHttpClient());
    const listing = await publishListingWithInventory(api, {
      catalogCardId: "card_1",
      catalogVariantId: "card_1:nonfoil",
      condition: "NM",
      language: "en",
      finish: "nonfoil",
      quantity: 2,
      priceCents: 2000,
    });

    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/marketplace/inventory");
    expect(fetchMock.mock.calls[1]![0]).toBe("/api/v1/marketplace/listings");
    expect(listing.id).toBe("listing-1");
    const listingBody = JSON.parse(String(fetchMock.mock.calls[1]![1]?.body));
    expect(listingBody.inventoryItemId).toBe("inv-1");
  });

  it("time_to_first_listing_ms a partir de shop_created", () => {
    markShopCreated("seller-1", Date.now() - 45_000);
    const ms = measureTimeToFirstListingMs(Date.now());
    expect(ms).toBeGreaterThanOrEqual(45_000);
    expect(ms).toBeLessThan(50_000);
    expect(measureTimeToFirstListingMs()).toBeNull();
  });
});
