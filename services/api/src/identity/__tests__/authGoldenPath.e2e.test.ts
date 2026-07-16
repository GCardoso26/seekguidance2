import { describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createInMemoryAuthenticatedStack } from "../createInMemoryAuthenticatedStack.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import type { EventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import type { DomainEvent } from "../../shared/events/types.js";
import { SearchEventConsumer } from "../../search/consumer/SearchEventConsumer.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { InMemorySearchProjectionRepository } from "../../search/persistence/InMemorySearchProjectionRepository.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  return typeof addr === "object" && addr ? addr.port : 0;
}

async function json(
  port: number,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? (JSON.parse(text) as Record<string, unknown>) : {} };
}

/**
 * Sprint 4.3 acceptance — first complete product story.
 *
 * register → login → JWT → onboard seller → inventory → publish listing
 *   → Outbox → publisher → Search consumer → GET /offers
 */
describe("Sprint 4.3 — golden path E2E", () => {
  it("buyer cannot publish; seller publishes and offer appears after Search projection", async () => {
    const stack = createInMemoryAuthenticatedStack();
    const server = stack.createServer();
    const port = await listen(server);

    // Search pipeline (in-process EventPublisher → SearchEventConsumer)
    const projection = new InMemorySearchProjectionRepository();
    await projection.ensureIndex();
    const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());
    const published: DomainEvent[] = [];
    const publisher: EventPublisher = {
      async publish(event) {
        published.push(event);
        await consumer.handle(event);
      },
    };
    const outboxWorker = new OutboxPublisherWorker(stack.marketplace.outbox, publisher, {
      workerId: "e2e-publisher",
    });

    const email = `seller-${getIdGenerator().generate().slice(0, 8)}@example.com`;
    const password = "s3cret-pass!";
    const cardId = getIdGenerator().generate();
    const variantId = getIdGenerator().generate();

    try {
      // 1. Register
      const reg = await json(port, "POST", "/api/v1/auth/register", {
        email,
        displayName: "Lojista E2E",
        password,
      });
      expect(reg.status).toBe(201);
      expect(reg.body.id).toBeTruthy();

      // 2. Login → JWT
      const login = await json(port, "POST", "/api/v1/auth/login", { email, password });
      expect(login.status).toBe(200);
      const accessToken = login.body.accessToken as string;
      const refreshToken = login.body.refreshToken as string;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(login.body.roles).toEqual(["buyer"]);

      // 3. Buyer cannot publish listing
      const forbidden = await json(
        port,
        "POST",
        "/api/v1/marketplace/listings",
        {
          catalogCardId: cardId,
          catalogVariantId: variantId,
          priceCents: 1990,
          condition: "NM",
          quantity: 2,
        },
        accessToken,
      );
      expect(forbidden.status).toBe(403);

      // 4. Onboard seller (CreateSeller → SellerProfile → AssignRole)
      const onboard = await json(
        port,
        "POST",
        "/api/v1/marketplace/sellers",
        { displayName: "Loja E2E" },
        accessToken,
      );
      expect(onboard.status).toBe(201);
      expect(onboard.body.sellerId).toBeTruthy();

      // 5. Create inventory
      const inv = await json(
        port,
        "POST",
        "/api/v1/marketplace/inventory",
        { catalogCardId: cardId, catalogVariantId: variantId, quantity: 5 },
        accessToken,
      );
      expect(inv.status).toBe(201);
      expect(inv.body.quantity).toBe(5);

      // 6. Publish listing
      const listing = await json(
        port,
        "POST",
        "/api/v1/marketplace/listings",
        {
          catalogCardId: cardId,
          catalogVariantId: variantId,
          inventoryItemId: inv.body.id,
          priceCents: 1990,
          condition: "NM",
          language: "en",
          finish: "nonfoil",
          quantity: 2,
          status: "active",
        },
        accessToken,
      );
      expect(listing.status).toBe(201);
      expect(listing.body.catalogCardId).toBe(cardId);
      expect(listing.body.priceCents).toBe(1990);
      expect(listing.body).not.toHaveProperty("name");

      // 7. Outbox has MarketplaceListingUpdated
      const pending = await stack.marketplace.outbox.countByStatus("pending");
      expect(pending).toBeGreaterThan(0);

      // 8. Publisher → Search consumer
      const tick = await outboxWorker.tick();
      expect(tick.published).toBeGreaterThan(0);
      expect(tick.dead).toBe(0);
      expect(published.some((e) => e.eventType === "MarketplaceListingUpdated")).toBe(true);

      // 9. Replay is idempotent (0 duplicates in projection / consumer skips)
      const tick2 = await outboxWorker.tick();
      expect(tick2.published).toBe(0);
      const replay = await consumer.handle(published[0]!);
      expect(replay).toBe("skipped");

      // 10. GET /offers returns the listing
      const offers = await json(port, "GET", `/api/v1/marketplace/cards/${cardId}/offers`);
      expect(offers.status).toBe(200);
      expect(offers.body.offerCount).toBe(1);
      expect(offers.body.bestPriceCents).toBe(1990);
      const offerList = offers.body.offers as Array<{ priceCents: number; catalogCardId: string }>;
      expect(offerList[0]!.catalogCardId).toBe(cardId);

      // 11. Refresh works
      const refreshed = await json(port, "POST", "/api/v1/auth/refresh", { refreshToken });
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.accessToken).toBeTruthy();

      // 12. Logout invalidates session
      await json(port, "POST", "/api/v1/auth/logout", { refreshToken });
      const afterLogout = await json(port, "POST", "/api/v1/auth/refresh", { refreshToken });
      expect(afterLogout.status).toBe(401);

      // 13. Dead = 0
      expect(await stack.marketplace.outbox.countByStatus("dead")).toBe(0);
    } finally {
      outboxWorker.stop();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
