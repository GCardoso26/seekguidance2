import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryJobQueue } from "../../platform/jobs/InMemoryJobQueue.js";
import { InMemoryOutboxRepository } from "../../platform/outbox/InMemoryOutboxRepository.js";
import { InMemoryTransactionManager } from "../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryCatalogCardRepository } from "../persistence/InMemoryCatalogCardRepository.js";
import { InMemoryCatalogSetRepository } from "../persistence/InMemoryCatalogSetRepository.js";
import { InMemoryCatalogVariantRepository } from "../persistence/InMemoryCatalogVariantRepository.js";
import { InMemoryProviderMappingRepository } from "../persistence/InMemoryProviderMappingRepository.js";
import { createCatalogApplicationServices } from "../application/createCatalogApplicationServices.js";
import { registerCatalogProcessors } from "../processors/registerCatalogProcessors.js";
import { CatalogQueueProducer } from "../producers/CatalogQueueProducer.js";
import { CatalogSyncScheduler } from "../scheduler/CatalogSyncScheduler.js";
import { OutboxPublisherWorker } from "../../platform/outbox/OutboxPublisherWorker.js";
import { InMemoryEventPublisher } from "../../platform/event-publisher/EventPublisher.js";
import { QUEUE_NAMES } from "../../platform/bullmq/queues.js";

/**
 * Smoke E2E: Scheduler → Producer → JobQueue → Processor → Application Service
 * (InMemory only — no Redis / PostgreSQL).
 */
describe("Catalog sync smoke E2E (InMemory)", () => {
  let jobs: InMemoryJobQueue;
  let sets: InMemoryCatalogSetRepository;
  let cards: InMemoryCatalogCardRepository;
  let variants: InMemoryCatalogVariantRepository;
  let mappings: InMemoryProviderMappingRepository;
  let outbox: InMemoryOutboxRepository;
  let scheduler: CatalogSyncScheduler;
  let publisher: InMemoryEventPublisher;
  const gameId = "11111111-1111-4111-8111-111111111111";
  const ctx = {
    requestId: "smoke-req-1",
    correlationId: "corr-smoke-1",
    providerId: "scryfall",
    gameCode: "MTG" as const,
  };

  beforeEach(() => {
    sets = new InMemoryCatalogSetRepository();
    cards = new InMemoryCatalogCardRepository();
    variants = new InMemoryCatalogVariantRepository();
    mappings = new InMemoryProviderMappingRepository();
    outbox = new InMemoryOutboxRepository();
    const tx = new InMemoryTransactionManager([sets, cards, variants, mappings, outbox]);
    const apps = createCatalogApplicationServices({
      tx,
      sets,
      cards,
      variants,
      mappings,
      outbox,
    });

    jobs = new InMemoryJobQueue({ maxAttempts: 2 });
    registerCatalogProcessors(jobs, apps);
    scheduler = new CatalogSyncScheduler(new CatalogQueueProducer(jobs));
    publisher = new InMemoryEventPublisher();
  });

  it("runs Scheduler → Producer → Processor → AS → Outbox → publish", async () => {
    const setJobId = await scheduler.scheduleSet({
      ...ctx,
      set: {
        gameId,
        code: "LEA",
        name: "Limited Edition Alpha",
        providerSetId: "lea",
      },
    });
    expect(jobs.getState(setJobId)?.status).toBe("queued");

    let drain = await jobs.drain(QUEUE_NAMES.catalogSets);
    expect(drain.processed).toBe(1);
    expect(jobs.getState(setJobId)?.status).toBe("completed");

    const set = await sets.findByGameAndCode({ id: "r", kind: "memory" }, gameId, "LEA");
    expect(set?.name).toBe("Limited Edition Alpha");

    const cardJobId = await scheduler.scheduleCard({
      ...ctx,
      card: {
        card: {
          gameId,
          setId: set!.id,
          name: "Lightning Bolt",
          normalizedName: "lightning bolt",
          cardNumber: "161",
        },
        mapping: { providerCardId: "sf-bolt", providerSetId: "lea" },
      },
    });

    drain = await jobs.drain(QUEUE_NAMES.catalogCards);
    expect(drain.processed).toBe(1);
    expect(jobs.getState(cardJobId)?.status).toBe("completed");

    const found = await cards.findByGameAndNormalizedName(
      { id: "r", kind: "memory" },
      gameId,
      "lightning bolt",
    );
    expect(found).toHaveLength(1);
    expect(found[0]!.setId).toBe(set!.id);

    const variantJobId = await scheduler.scheduleVariant({
      ...ctx,
      variant: {
        variant: {
          cardId: found[0]!.id,
          finish: "foil",
          isFoil: true,
          label: "Foil",
        },
        mapping: { providerVariantId: "sf-bolt-foil", providerCardId: "sf-bolt" },
      },
    });
    drain = await jobs.drain(QUEUE_NAMES.catalogVariants);
    expect(drain.processed).toBe(1);
    expect(jobs.getState(variantJobId)?.status).toBe("completed");

    expect(await outbox.countByStatus("pending")).toBe(3);

    const worker = new OutboxPublisherWorker(outbox, publisher, {
      workerId: "smoke-publisher",
      leaseMs: 10_000,
    });
    const tick = await worker.tick();
    expect(tick.published).toBe(3);
    expect(publisher.published.map((e) => e.eventType).sort()).toEqual([
      "CardUpdated",
      "SetUpdated",
      "VariantUpdated",
    ]);
    expect(publisher.published.every((e) => e.metadata.correlationId === "corr-smoke-1")).toBe(
      true,
    );
  });

  it("processors reject non-command jobTypes", async () => {
    await jobs.enqueue(QUEUE_NAMES.catalogCards, {
      jobType: "CardUpdated",
      jobVersion: 1,
      requestId: "x",
      correlationId: "x",
      providerId: "scryfall",
      gameCode: "MTG",
      priority: "NORMAL",
      attempt: 1,
      payload: {},
    });
    const drain = await jobs.drain(QUEUE_NAMES.catalogCards);
    expect(drain.failed).toBe(1);
    // maxAttempts=2 → first fail → retry/queued, second drain would dead
    expect(jobs.listByStatus("queued")).toHaveLength(1);
    await jobs.drain(QUEUE_NAMES.catalogCards);
    expect(jobs.listByStatus("dead")).toHaveLength(1);
  });

  it("producer API exposes only Sync* commands", () => {
    const producer = new CatalogQueueProducer(jobs);
    expect("enqueueCardUpdated" in producer).toBe(false);
    expect(typeof producer.enqueueSyncSet).toBe("function");
    expect(typeof producer.enqueueSyncCard).toBe("function");
    expect(typeof producer.enqueueSyncVariant).toBe("function");
  });
});
