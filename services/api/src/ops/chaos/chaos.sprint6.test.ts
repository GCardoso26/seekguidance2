/**
 * Sprint 6 — Chaos scenarios (ops/chaos).
 * C1 Redis offline · C2 Search offline · C3 Worker restart · C4 Payment webhook duplicate
 */
import { describe, expect, it } from "vitest";
import { createInMemoryMarketplaceStack } from "../../marketplace/createInMemoryMarketplaceStack.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import type { EventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import type { DomainEvent } from "../../shared/events/types.js";
import { SearchEventConsumer } from "../../search/consumer/SearchEventConsumer.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { InMemorySearchProjectionRepository } from "../../search/persistence/InMemorySearchProjectionRepository.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { createInMemoryCheckoutApiStack } from "../../order/createInMemoryCheckoutApiStack.js";
import { fakePaymentSignature } from "../../payment/infrastructure/fake/FakePaymentProvider.js";
import type { Server } from "node:http";
import { domainMetrics } from "../../observability/metrics/domainMetrics.js";
import { metrics } from "../../platform/metrics/registry.js";
import { collectOutboxMetrics } from "../../observability/collectors/outboxCollector.js";

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
  headers?: Record<string, string>,
) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers ?? {}),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: h,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return {
    status: res.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
  };
}

describe("Sprint 6 — chaos", () => {
  it("C1 Redis offline: Outbox accumulates; recovery publishes all; 0 loss", async () => {
    const mkt = createInMemoryMarketplaceStack();
    const seller = await mkt.registerSeller.execute({
      displayName: "Chaos Redis",
      slug: `chaos-redis-${getIdGenerator().generate().slice(0, 6)}`,
    });
    await mkt.publishListing.execute({
      requestId: "c1-1",
      listing: {
        sellerId: seller.entity.id,
        catalogCardId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        priceCents: 500,
        condition: "NM",
        language: "en",
        quantity: 1,
        status: "active",
      },
    });

    const failing: EventPublisher = {
      async publish() {
        domainMetrics.outboxPublishFail();
        throw new Error("redis_unavailable");
      },
    };
    const failWorker = new OutboxPublisherWorker(mkt.outbox, failing, {
      workerId: "c1-fail",
      leaseMs: 50,
    });
    await failWorker.tick();
    await collectOutboxMetrics(mkt.outbox);
    expect(await mkt.outbox.countByStatus("dead")).toBe(0);
    const pending =
      (await mkt.outbox.countByStatus("pending")) +
      (await mkt.outbox.countByStatus("leased"));
    expect(pending).toBeGreaterThan(0);

    const projection = new InMemorySearchProjectionRepository();
    await projection.ensureIndex();
    const consumer = new SearchEventConsumer(
      projection,
      new InMemoryConsumerOffsetRepository(),
    );
    const delivered: DomainEvent[] = [];
    const ok: EventPublisher = {
      async publish(event) {
        delivered.push(event);
        await consumer.handle(event);
      },
    };
    await new Promise((r) => setTimeout(r, 1_200));
    const okWorker = new OutboxPublisherWorker(mkt.outbox, ok, {
      workerId: "c1-ok",
      leaseMs: 5_000,
    });
    const tick = await okWorker.tick();
    expect(tick.published).toBeGreaterThan(0);
    expect(tick.dead).toBe(0);
    expect(await mkt.outbox.countByStatus("pending")).toBe(0);
    expect(delivered.length).toBeGreaterThan(0);
  });

  it("C2 Search offline: Catalog/Marketplace keep writing; events wait in Outbox", async () => {
    const mkt = createInMemoryMarketplaceStack();
    const seller = await mkt.registerSeller.execute({
      displayName: "Chaos Search",
      slug: `chaos-search-${getIdGenerator().generate().slice(0, 6)}`,
    });
    // Catalog path continues (listing write succeeds) even if search consumer is down.
    await mkt.publishListing.execute({
      requestId: "c2-1",
      listing: {
        sellerId: seller.entity.id,
        catalogCardId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        priceCents: 700,
        condition: "NM",
        language: "en",
        quantity: 2,
        status: "active",
      },
    });
    expect(await mkt.outbox.countByStatus("pending")).toBeGreaterThan(0);
    // No consumer — events wait
    expect(await mkt.outbox.countByStatus("dead")).toBe(0);
  });

  it("C3 Worker restart: consumer offset preserved (idempotent handoff)", async () => {
    const mkt = createInMemoryMarketplaceStack();
    const seller = await mkt.registerSeller.execute({
      displayName: "Chaos Worker",
      slug: `chaos-worker-${getIdGenerator().generate().slice(0, 6)}`,
    });
    await mkt.publishListing.execute({
      requestId: "c3-1",
      listing: {
        sellerId: seller.entity.id,
        catalogCardId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        priceCents: 900,
        condition: "NM",
        language: "en",
        quantity: 1,
        status: "active",
      },
    });

    const offsets = new InMemoryConsumerOffsetRepository();
    const projection = new InMemorySearchProjectionRepository();
    await projection.ensureIndex();
    const consumerA = new SearchEventConsumer(projection, offsets);
    const delivered: DomainEvent[] = [];
    const publisher: EventPublisher = {
      async publish(event) {
        delivered.push(event);
        await consumerA.handle(event);
      },
    };
    const workerA = new OutboxPublisherWorker(mkt.outbox, publisher, {
      workerId: "worker-a",
      leaseMs: 5_000,
    });
    await workerA.tick();
    expect(delivered.length).toBe(1);

    // Restart: new consumer same offsets — replay is skipped
    const consumerB = new SearchEventConsumer(projection, offsets);
    const replay = await consumerB.handle(delivered[0]!);
    expect(replay).toBe("skipped");
  });

  it("C4 Payment webhook duplicate: no state change · metric increments", async () => {
    metrics.reset();
    const stack = createInMemoryCheckoutApiStack();
    const server = stack.createServer();
    const port = await listen(server);
    const password = "chaos-pay-1!";
    try {
      const sellerEmail = `s-${getIdGenerator().generate().slice(0, 8)}@c.local`;
      const buyerEmail = `b-${getIdGenerator().generate().slice(0, 8)}@c.local`;
      await json(port, "POST", "/api/v1/auth/register", {
        email: sellerEmail,
        displayName: "S",
        password,
      });
      const sLogin = await json(port, "POST", "/api/v1/auth/login", {
        email: sellerEmail,
        password,
      });
      await json(port, "POST", "/api/v1/auth/register", {
        email: buyerEmail,
        displayName: "B",
        password,
      });
      const bLogin = await json(port, "POST", "/api/v1/auth/login", {
        email: buyerEmail,
        password,
      });
      const sellerToken = sLogin.body.accessToken as string;
      const buyerToken = bLogin.body.accessToken as string;

      await json(
        port,
        "POST",
        "/api/v1/marketplace/sellers",
        { displayName: "Chaos Pay" },
        sellerToken,
      );
      const cardId = getIdGenerator().generate();
      const variantId = getIdGenerator().generate();
      const inv = await json(
        port,
        "POST",
        "/api/v1/marketplace/inventory",
        { catalogCardId: cardId, catalogVariantId: variantId, quantity: 1 },
        sellerToken,
      );
      const listing = await json(
        port,
        "POST",
        "/api/v1/marketplace/listings",
        {
          catalogCardId: cardId,
          catalogVariantId: variantId,
          inventoryItemId: inv.body.id,
          priceCents: 1000,
          condition: "NM",
          quantity: 1,
          status: "active",
        },
        sellerToken,
      );
      const cart = await json(port, "POST", "/api/v1/cart", {}, buyerToken);
      await json(
        port,
        "POST",
        `/api/v1/cart/${cart.body.id}/items`,
        { listingId: listing.body.id, quantity: 1 },
        buyerToken,
      );
      const checkout = await json(
        port,
        "POST",
        "/api/v1/checkout",
        { cartId: cart.body.id },
        buyerToken,
      );
      const pay = await json(
        port,
        "POST",
        `/api/v1/checkout/${checkout.body.checkoutSessionId}/pay`,
        {},
        buyerToken,
      );
      const paymentId = pay.body.paymentId as string;
      const sig = { "X-Payment-Signature": fakePaymentSignature(paymentId) };
      const body = {
        provider: "fake",
        event: "payment.approved",
        paymentId,
        idempotencyKey: `chaos-dup-${paymentId}`,
      };
      const first = await json(port, "POST", "/api/v1/payments/webhook", body, undefined, sig);
      const second = await json(port, "POST", "/api/v1/payments/webhook", body, undefined, sig);
      expect(first.body.paymentStatus).toBe("AUTHORIZED");
      expect(second.body.duplicate).toBe(true);
      expect(second.body.paymentStatus).toBe("AUTHORIZED");
      expect(metrics.getCounter("payment_webhook_duplicate_total")).toBeGreaterThanOrEqual(1);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
