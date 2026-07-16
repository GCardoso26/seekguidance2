import { describe, expect, it, beforeEach } from "vitest";
import { createDomainEvent } from "../../../shared/events/types.js";
import { InMemoryOutboxRepository } from "../InMemoryOutboxRepository.js";
import { OutboxPublisherWorker } from "../OutboxPublisherWorker.js";
import { InMemoryEventPublisher } from "../../event-publisher/EventPublisher.js";
import { InMemoryConsumerOffsetRepository } from "../ConsumerOffsetRepository.js";
import { processOnce } from "../processOnce.js";
import { SimulatedUnitOfWork } from "../SimulatedUnitOfWork.js";
import { metrics } from "../../metrics/registry.js";

describe("Outbox acceptance criteria", () => {
  let outbox: InMemoryOutboxRepository;
  let publisher: InMemoryEventPublisher;

  beforeEach(() => {
    outbox = new InMemoryOutboxRepository();
    publisher = new InMemoryEventPublisher();
    metrics.reset();
  });

  it("commit-before-publish: event invisible until commit", async () => {
    const uow = new SimulatedUnitOfWork();
    const event = createDomainEvent(
      "CardUpdated",
      "card-1",
      { name: "Bolt" },
      { aggregateType: "catalog_card", correlationId: "c1" },
    );

    uow.scheduleOutboxInsert(async () => {
      await outbox.insert({ event });
    });

    const worker = new OutboxPublisherWorker(outbox, publisher, {
      workerId: "w1",
      leaseMs: 5_000,
    });

    let tick = await worker.tick();
    expect(tick.claimed).toBe(0);
    expect(publisher.published).toHaveLength(0);

    await uow.commit();
    expect(uow.isCommitted).toBe(true);

    tick = await worker.tick();
    expect(tick.published).toBe(1);
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]!.eventType).toBe("CardUpdated");
  });

  it("crash recovery: expired lease is reclaimed by another worker", async () => {
    const event = createDomainEvent(
      "CardUpdated",
      "card-2",
      {},
      { aggregateType: "catalog_card", id: "evt-lease-1" },
    );
    await outbox.insert({ event });

    const now = new Date("2026-07-16T12:00:00Z");
    const claimed = await outbox.claimBatch({
      workerId: "worker-dead",
      leaseMs: 1_000,
      limit: 1,
      now,
    });
    expect(claimed).toHaveLength(1);
    expect(claimed[0]!.status).toBe("leased");
    expect(claimed[0]!.leasedBy).toBe("worker-dead");

    const mid = await outbox.claimBatch({
      workerId: "worker-02",
      leaseMs: 1_000,
      limit: 1,
      now: new Date(now.getTime() + 500),
    });
    expect(mid).toHaveLength(0);

    const recovered = await outbox.claimBatch({
      workerId: "worker-02",
      leaseMs: 5_000,
      limit: 1,
      now: new Date(now.getTime() + 2_000),
    });
    expect(recovered).toHaveLength(1);
    expect(recovered[0]!.leasedBy).toBe("worker-02");
  });

  it("idempotency: republishing same event id does not duplicate fan-out", async () => {
    const event = createDomainEvent(
      "CardUpdated",
      "card-3",
      {},
      { aggregateType: "catalog_card", id: "evt-idem-1" },
    );
    await outbox.insert({ event });

    const worker = new OutboxPublisherWorker(outbox, publisher, {
      workerId: "w1",
      leaseMs: 10_000,
    });

    expect((await worker.tick()).published).toBe(1);
    expect(publisher.published).toHaveLength(1);

    expect((await worker.tick()).published).toBe(0);
    await publisher.publish(event);
    expect(publisher.published).toHaveLength(1);
    expect(metrics.getCounter("outbox_published_total")).toBe(1);
  });

  it("DLQ: after max_attempts event becomes dead without further auto retry", async () => {
    const event = createDomainEvent(
      "CardUpdated",
      "card-4",
      {},
      { aggregateType: "catalog_card", id: "evt-dead-1" },
    );
    await outbox.insert({ event, maxAttempts: 2 });

    const now = new Date();
    let batch = await outbox.claimBatch({
      workerId: "w1",
      leaseMs: 10_000,
      limit: 1,
      now,
    });
    expect(batch).toHaveLength(1);
    let row = await outbox.markPublishFailed(batch[0]!.id, "fail-1", now);
    expect(row.status).toBe("pending");
    expect(row.attempts).toBe(1);

    const far = new Date(now.getTime() + 86_400_000);
    batch = await outbox.claimBatch({
      workerId: "w1",
      leaseMs: 10_000,
      limit: 1,
      now: far,
    });
    expect(batch).toHaveLength(1);
    row = await outbox.markPublishFailed(batch[0]!.id, "fail-2", far);
    expect(row.status).toBe("dead");
    expect(row.attempts).toBe(2);

    const none = await outbox.claimBatch({
      workerId: "w2",
      leaseMs: 10_000,
      limit: 5,
      now: new Date(far.getTime() + 1_000),
    });
    expect(none).toHaveLength(0);
  });

  it("consumer offsets: same event not processed twice", async () => {
    const offsets = new InMemoryConsumerOffsetRepository();
    const event = createDomainEvent(
      "PriceUpdated",
      "card-5",
      { market: 1 },
      { aggregateType: "catalog_card", id: "evt-cons-1" },
    );
    let runs = 0;
    const handler = async () => {
      runs += 1;
    };

    expect(await processOnce(offsets, "search-sync", event, handler)).toBe("success");
    expect(await processOnce(offsets, "search-sync", event, handler)).toBe("skipped");
    expect(runs).toBe(1);
  });

  it("concurrency: two publishers do not claim the same event", async () => {
    const event = createDomainEvent(
      "CardUpdated",
      "card-6",
      {},
      { aggregateType: "catalog_card", id: "evt-conc-1" },
    );
    await outbox.insert({ event });

    const [a, b] = await Promise.all([
      outbox.claimBatch({ workerId: "A", leaseMs: 30_000, limit: 10 }),
      outbox.claimBatch({ workerId: "B", leaseMs: 30_000, limit: 10 }),
    ]);

    const ids = [...a, ...b].map((r) => r.id);
    expect(ids).toHaveLength(1);
    expect(new Set(ids).size).toBe(1);
  });

  it("observability metrics: backlog, published, oldest age", async () => {
    await outbox.insert({
      event: createDomainEvent("CardUpdated", "c", {}, { aggregateType: "catalog_card", id: "e1" }),
    });
    await outbox.insert({
      event: createDomainEvent("CardUpdated", "c2", {}, { aggregateType: "catalog_card", id: "e2" }),
    });

    const worker = new OutboxPublisherWorker(outbox, publisher, {
      workerId: "w1",
      leaseMs: 10_000,
    });
    await worker.tick();

    expect(metrics.getCounter("outbox_published_total")).toBe(2);
    expect(metrics.getGauge("outbox_backlog")).toBe(0);
    expect(await outbox.oldestPendingAgeSeconds()).toBeNull();
  });

  it("payload is immutable via repository API", () => {
    expect(() =>
      outbox.tryUpdatePayload(
        "x",
        createDomainEvent("CardUpdated", "a", {}, { aggregateType: "c" }),
      ),
    ).toThrow(/immutable/);
  });

  it("envelope carries correlation and causation", () => {
    const sync = createDomainEvent(
      "SyncStarted",
      "sync-1",
      {},
      { aggregateType: "sync_run", id: "sync-evt", correlationId: "corr-9" },
    );
    const card = createDomainEvent(
      "CardUpdated",
      "card-x",
      {},
      {
        aggregateType: "catalog_card",
        correlationId: sync.correlationId,
        causationId: sync.id,
        projectionVersion: "cards_v1",
      },
    );
    expect(card.correlationId).toBe("corr-9");
    expect(card.causationId).toBe("sync-evt");
    expect(card.eventVersion).toBe(1);
    expect(card.schemaVersion).toBe(1);
    expect(card.projectionVersion).toBe("cards_v1");
  });
});
