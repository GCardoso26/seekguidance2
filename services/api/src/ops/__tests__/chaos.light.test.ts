import { describe, expect, it } from "vitest";
import { createInMemoryMarketplaceStack } from "../../marketplace/createInMemoryMarketplaceStack.js";
import { createInMemoryIdentityStack } from "../../identity/createInMemoryIdentityStack.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import type { EventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import type { DomainEvent } from "../../shared/events/types.js";
import { SearchEventConsumer } from "../../search/consumer/SearchEventConsumer.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { InMemorySearchProjectionRepository } from "../../search/persistence/InMemorySearchProjectionRepository.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { createInMemoryAuthenticatedStack } from "../../identity/createInMemoryAuthenticatedStack.js";
import type { Server } from "node:http";

/**
 * Sprint 4.4 — light chaos scenarios (no heavy failure injection framework).
 */
describe("Sprint 4.4 — light chaos", () => {
  it("Redis unavailable: Outbox accumulates, then catch-up with 0 losses", async () => {
    const mkt = createInMemoryMarketplaceStack();
    const seller = await mkt.registerSeller.execute({ displayName: "Chaos Shop", slug: "chaos-shop" });
    const cardId = getIdGenerator().generate();
    const variantId = getIdGenerator().generate();

    await mkt.publishListing.execute({
      requestId: "chaos-1",
      listing: {
        sellerId: seller.entity.id,
        catalogCardId: cardId,
        catalogVariantId: variantId,
        priceCents: 1000,
        condition: "NM",
        language: "en",
        quantity: 1,
        status: "active",
      },
    });

    // Publisher down (simulates Redis unavailable)
    const failing: EventPublisher = {
      async publish() {
        throw new Error("redis_unavailable");
      },
    };
    const failWorker = new OutboxPublisherWorker(mkt.outbox, failing, {
      workerId: "chaos-fail",
      leaseMs: 50,
    });
    const failTick = await failWorker.tick();
    expect(failTick.published).toBe(0);
    // Still pending (or leased→retry), not dead on first failure with default maxAttempts
    expect(await mkt.outbox.countByStatus("dead")).toBe(0);
    const pendingOrLeased =
      (await mkt.outbox.countByStatus("pending")) + (await mkt.outbox.countByStatus("leased"));
    expect(pendingOrLeased).toBeGreaterThan(0);

    // Redis recovers — catch-up
    const projection = new InMemorySearchProjectionRepository();
    await projection.ensureIndex();
    const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());
    const delivered: DomainEvent[] = [];
    const recovering: EventPublisher = {
      async publish(event) {
        delivered.push(event);
        await consumer.handle(event);
      },
    };

    // Wait for backoff if needed
    await new Promise((r) => setTimeout(r, 1_200));
    const okWorker = new OutboxPublisherWorker(mkt.outbox, recovering, {
      workerId: "chaos-ok",
      leaseMs: 5_000,
    });
    const okTick = await okWorker.tick();
    expect(okTick.published).toBeGreaterThan(0);
    expect(okTick.dead).toBe(0);
    expect(delivered.some((e) => e.eventType === "MarketplaceListingUpdated")).toBe(true);
    expect(await mkt.outbox.countByStatus("dead")).toBe(0);
    expect(await mkt.outbox.countByStatus("pending")).toBe(0);
  });

  it("Worker dead: new worker assumes with preserved offsets (idempotent)", async () => {
    const projection = new InMemorySearchProjectionRepository();
    await projection.ensureIndex();
    const offsets = new InMemoryConsumerOffsetRepository();
    const consumerA = new SearchEventConsumer(projection, offsets, "search-chaos");
    const consumerB = new SearchEventConsumer(projection, offsets, "search-chaos");

    const { createDomainEvent } = await import("../../shared/events/types.js");
    const ev = createDomainEvent(
      "MarketplaceListingUpdated",
      getIdGenerator().generate(),
      { cardId: getIdGenerator().generate(), storeId: "s1", price: 100, stock: 1, currency: "BRL" },
      { id: getIdGenerator().generate(), aggregateType: "listing" },
    );

    expect(await consumerA.handle(ev)).toBe("applied");
    // Worker A "dies"; Worker B takes over — same offset store → skip
    expect(await consumerB.handle(ev)).toBe("skipped");
  });

  it("API restart: JWT still valid when Session store survives", async () => {
    // Shared identity stack = surviving session DB; new HTTP server = API restart
    const identity = createInMemoryIdentityStack({ jwtSecret: "chaos-restart-secret!" });
    await identity.registerUser.execute({
      email: "restart@example.com",
      displayName: "R",
      password: "pass-12345",
    });
    const tokens = await identity.login.execute({
      email: "restart@example.com",
      password: "pass-12345",
    });

    // "Restart" = new JWT adapter with SAME secret + same session repo
    const { HmacJwtAdapter } = await import("../../identity/persistence/HmacJwtAdapter.js");
    const { createAuthMiddleware } = await import("../../identity/http/authMiddleware.js");
    const jwt = new HmacJwtAdapter("chaos-restart-secret!");
    const auth = createAuthMiddleware({
      jwt,
      tx: identity.tx,
      sessions: identity.sessions,
      roles: identity.roles,
    });

    const claims = jwt.verify(tokens.accessToken);
    expect(claims.typ).toBe("access");
    expect(claims.sub).toBe(tokens.userId);

    // Simulate RequireAuth via forged IncomingMessage-like header
    const req = {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    } as import("node:http").IncomingMessage;
    const user = await auth.requireAuth(req);
    expect(user.userId).toBe(tokens.userId);

    const refreshed = await identity.refresh.execute(tokens.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
  });

  it("Authenticated stack survives seller publish after simulated process handoff", async () => {
    const stack = createInMemoryAuthenticatedStack({ jwtSecret: "handoff-secret!!" });
    const server = stack.createServer();
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;

    async function call(method: string, path: string, body?: unknown, token?: string) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });
      return { status: res.status, body: (await res.json()) as Record<string, unknown> };
    }

    try {
      const email = `h-${getIdGenerator().generate().slice(0, 6)}@ex.com`;
      await call("POST", "/api/v1/auth/register", {
        email,
        displayName: "H",
        password: "pass-12345",
      });
      const login = await call("POST", "/api/v1/auth/login", { email, password: "pass-12345" });
      const token = login.body.accessToken as string;
      await call("POST", "/api/v1/marketplace/sellers", { displayName: "H Shop" }, token);
      const cardId = getIdGenerator().generate();
      const listing = await call(
        "POST",
        "/api/v1/marketplace/listings",
        {
          catalogCardId: cardId,
          catalogVariantId: getIdGenerator().generate(),
          priceCents: 500,
          condition: "NM",
          quantity: 1,
          status: "active",
        },
        token,
      );
      expect(listing.status).toBe(201);
    } finally {
      await new Promise<void>((r) => (server as Server).close(() => r()));
    }
  });
});
