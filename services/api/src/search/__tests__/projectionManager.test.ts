import { describe, expect, it } from "vitest";
import { createDomainEvent } from "../../shared/events/types.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { SearchEventConsumer } from "../consumer/SearchEventConsumer.js";
import { InMemorySearchProjectionRepository } from "../persistence/InMemorySearchProjectionRepository.js";
import { ProjectionManager } from "../ProjectionManager.js";
import { ProjectionSearchQueryService } from "../application/ProjectionSearchQueryService.js";
import { computeProjectionCoverage } from "../domain/ProjectionCoverage.js";

describe("Sprint 3.1 — ProjectionManager", () => {
  it("rebuild → swap alias → retire previous", async () => {
    const repo = new InMemorySearchProjectionRepository();
    const mgr = new ProjectionManager(repo);
    await mgr.ensureIndexes();
    expect(mgr.getLiveAlias()).toBe("cards_v1");

    const rebuild = await mgr.beginRebuild();
    expect(rebuild.building.name).toBe("cards_v2");
    expect(rebuild.liveAlias).toBe("cards_v1"); // alias still old until swap

    const swap = await mgr.swapAlias();
    expect(swap.alias).toBe("cards_v2");
    expect(mgr.verifyVersion("cards_v2").ok).toBe(true);

    await mgr.retirePrevious();
  });

  it("coverage and drift", async () => {
    const repo = new InMemorySearchProjectionRepository();
    const mgr = new ProjectionManager(repo);
    const consumer = new SearchEventConsumer(
      repo,
      new InMemoryConsumerOffsetRepository(),
      undefined,
      mgr,
    );

    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "c1",
        { name: "Bolt" },
        { id: "e1", aggregateType: "catalog_card" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "c2",
        { name: "Lotus" },
        { id: "e2", aggregateType: "catalog_card" },
      ),
    );

    const cov = await mgr.coverage(2);
    expect(cov.projectionCards).toBe(2);
    expect(cov.catalogCards).toBe(2);
    expect(cov.coveragePct).toBe(100);

    const partial = computeProjectionCoverage({
      catalogCards: 250_000,
      projectionCards: 249_800,
      projection: "cards_v1",
    });
    expect(partial.coveragePct).toBeCloseTo(99.92, 2);

    repo.setPendingApprox(42);
    const drift = await mgr.drift({
      lastCatalogUpdateAt: "2026-07-16T12:05:00.000Z",
      changedSinceProjection: 42,
    });
    expect(drift.changedSinceProjection).toBe(42);
    expect(drift.lastCatalogUpdateAt).toContain("12:05");
  });

  it("records sync lead time on apply", async () => {
    const repo = new InMemorySearchProjectionRepository();
    const mgr = new ProjectionManager(repo);
    const consumer = new SearchEventConsumer(
      repo,
      new InMemoryConsumerOffsetRepository(),
      undefined,
      mgr,
    );

    const past = new Date(Date.now() - 5_000).toISOString();
    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "c1",
        { name: "Bolt" },
        { id: "lead-1", aggregateType: "catalog_card", occurredAt: past },
      ),
    );

    const stats = mgr.leadTimeStats();
    expect(stats.samples).toBe(1);
    expect(stats.lastMs).toBeGreaterThanOrEqual(4_000);
  });

  it("SearchQueryService is read-only over projection", async () => {
    const repo = new InMemorySearchProjectionRepository();
    const consumer = new SearchEventConsumer(repo, new InMemoryConsumerOffsetRepository());
    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "card-9",
        {
          name: "Counterspell",
          setCode: "LEA",
          setName: "Limited Edition Alpha",
          oracleText: "Counter target spell.",
        },
        { id: "q1", aggregateType: "catalog_card" },
      ),
    );

    const qs = new ProjectionSearchQueryService(repo);
    const search = await qs.search({ q: "Counter" });
    expect(search.hits[0]!.document.id).toBe("card-9");

    const card = await qs.getCard("card-9");
    expect(card?.name).toBe("Counterspell");

    const set = await qs.getSet("lea");
    expect(set?.cardCount).toBe(1);

    const suggestions = await qs.suggest("Coun");
    expect(suggestions[0]!.name).toBe("Counterspell");
  });

  it("cannot retire live alias", async () => {
    const mgr = new ProjectionManager(new InMemorySearchProjectionRepository());
    await expect(mgr.retire(mgr.getLiveAlias())).rejects.toThrow(/cannot_retire_live_alias/);
  });
});
