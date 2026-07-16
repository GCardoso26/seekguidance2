import { describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryMarketplaceStack } from "../createInMemoryMarketplaceStack.js";
import { createMarketplaceReadServer } from "../http/createMarketplaceReadServer.js";
import { renderCardWithOffers } from "../RenderedCard.js";
import type { Listing } from "../domain/models.js";

async function getJson(
  port: number,
  path: string,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  return typeof addr === "object" && addr ? addr.port : 0;
}

describe("Sprint 4 — Marketplace aggregates", () => {
  it("Seller aggregate: onboarding, slugify, idempotency", async () => {
    const stack = createInMemoryMarketplaceStack();
    const created = await stack.registerSeller.execute({ displayName: "Loja do João" });
    expect(created.outcome).toBe("created");
    expect(created.entity.slug).toBe("loja-do-joao");
    expect(created.entity.status).toBe("pending");
    expect(created.entity.verification).toBe("unverified");

    const again = await stack.registerSeller.execute({
      displayName: "Loja do João",
      slug: "Loja do João",
    });
    expect(again.outcome).toBe("unchanged");
  });

  it("Inventory aggregate has quantity but no price", async () => {
    const stack = createInMemoryMarketplaceStack();
    const seller = await stack.registerSeller.execute({ displayName: "S" });
    const inv = await stack.adjustInventory.execute({
      sellerId: seller.entity.id,
      catalogCardId: "card-1",
      catalogVariantId: "card-1:nonfoil",
      quantity: 5,
    });
    expect(inv.entity.quantity).toBe(5);
    expect(inv.entity).not.toHaveProperty("priceCents");
    await expect(
      stack.adjustInventory.execute({
        sellerId: seller.entity.id,
        catalogCardId: "card-1",
        catalogVariantId: "card-1:nonfoil",
        quantity: -1,
      }),
    ).rejects.toThrow("inventory_quantity_negative");
  });

  it("Listing references Catalog IDs only and emits MarketplaceListingUpdated", async () => {
    const stack = createInMemoryMarketplaceStack();
    const seller = await stack.registerSeller.execute({ displayName: "S" });
    const published = await stack.publishListing.execute({
      requestId: "req-1",
      listing: {
        sellerId: seller.entity.id,
        catalogCardId: "card-1",
        catalogVariantId: "card-1:nonfoil",
        priceCents: 1990,
        condition: "NM",
        language: "en",
        finish: "nonfoil",
        quantity: 2,
        status: "active",
      },
    });
    expect(published.outcome).toBe("created");
    // ADR-007: never copies official data.
    expect(published.entity).not.toHaveProperty("name");
    expect(published.entity).not.toHaveProperty("oracleText");
    expect(published.entity).not.toHaveProperty("artist");
    expect(published.entity.catalogCardId).toBe("card-1");

    const claimed = await stack.outbox.claimBatch({
      workerId: "w1",
      leaseMs: 1000,
      limit: 10,
    });
    const ev = claimed.find((r) => r.eventName === "MarketplaceListingUpdated");
    expect(ev).toBeTruthy();
    expect((ev!.payload.payload as { cardId: string }).cardId).toBe("card-1");
    expect((ev!.payload.payload as { storeId: string }).storeId).toBe(seller.entity.id);
    expect((ev!.payload.payload as { price: number }).price).toBe(1990);
  });

  it("RenderedCard overlays offers without mutating official data", () => {
    const rendered = renderCardWithOffers(
      { catalogCardId: "card-1", name: "Lightning Bolt", imageUrl: "https://cdn/official.webp" },
      [
        { listingId: "L1", priceCents: 2500, currency: "BRL", quantity: 1, condition: "LP" },
        { listingId: "L2", priceCents: 1990, currency: "BRL", quantity: 2, condition: "NM" },
      ],
    );
    expect(rendered.official.name).toBe("Lightning Bolt");
    expect(rendered.offerCount).toBe(2);
    expect(rendered.bestPriceCents).toBe(1990);
  });
});

describe("Sprint 4 — /api/v1/marketplace read API", () => {
  it("serves offers/listings/sellers (read-only, active only, sorted)", async () => {
    const stack = createInMemoryMarketplaceStack();
    const seller = await stack.registerSeller.execute({ displayName: "Loja" });

    const base = {
      sellerId: seller.entity.id,
      catalogCardId: "card-1",
      catalogVariantId: "card-1:nonfoil",
      condition: "NM",
      language: "en",
    };
    await stack.publishListing.execute({
      requestId: "r1",
      listing: { ...base, priceCents: 2500, quantity: 1, status: "active" },
    });
    await stack.publishListing.execute({
      requestId: "r2",
      listing: { ...base, priceCents: 1990, quantity: 3, status: "active" },
    });
    await stack.publishListing.execute({
      requestId: "r3",
      listing: { ...base, priceCents: 100, quantity: 1, status: "draft" },
    });

    const server = createMarketplaceReadServer({ queries: stack.queries });
    const port = await listen(server);
    try {
      const offers = await getJson(port, "/api/v1/marketplace/cards/card-1/offers");
      expect(offers.status).toBe(200);
      const body = offers.body as { offerCount: number; bestPriceCents: number; offers: Listing[] };
      expect(body.offerCount).toBe(2); // draft excluded
      expect(body.bestPriceCents).toBe(1990);
      expect(body.offers[0]!.priceCents).toBe(1990); // sorted asc

      const listings = await getJson(port, "/api/v1/marketplace/listings?cardId=card-1");
      expect(listings.status).toBe(200);
      expect((listings.body as { items: unknown[] }).items.length).toBe(2);

      const missingCard = await getJson(port, "/api/v1/marketplace/listings");
      expect(missingCard.status).toBe(400);

      const sellerRes = await getJson(port, `/api/v1/marketplace/sellers/${seller.entity.id}`);
      expect(sellerRes.status).toBe(200);
      expect((sellerRes.body as { slug: string }).slug).toBe("loja");

      const sellerListings = await getJson(
        port,
        `/api/v1/marketplace/sellers/${seller.entity.id}/listings`,
      );
      expect((sellerListings.body as { items: unknown[] }).items.length).toBe(3);

      const notFound = await getJson(port, "/api/v1/marketplace/sellers/nope");
      expect(notFound.status).toBe(404);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
