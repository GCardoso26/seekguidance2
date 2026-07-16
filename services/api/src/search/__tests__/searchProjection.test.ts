import { describe, expect, it } from "vitest";
import { createDomainEvent } from "../../shared/events/types.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { SearchEventConsumer } from "../consumer/SearchEventConsumer.js";
import { InMemorySearchProjectionRepository } from "../persistence/InMemorySearchProjectionRepository.js";
import { evaluateProjectionHealth } from "../domain/ProjectionHealth.js";
import { buildSearchPerformanceReport } from "../report/SearchPerformanceReport.js";
import { createProjectionVersion } from "../domain/SearchProjectionVersion.js";

describe("Sprint 3 — Search Projection", () => {
  it("applies Card/Variant/Price/Media/Listing without touching Catalog", async () => {
    const projection = new InMemorySearchProjectionRepository();
    const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());

    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "card-1",
        {
          name: "Lightning Bolt",
          normalizedName: "lightning bolt",
          oracleText: "Bolt deals 3 damage to any target.",
          setCode: "lea",
          language: "en",
          rarity: "common",
        },
        { aggregateType: "catalog_card", id: "evt-card-1" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "VariantUpdated",
        "var-1",
        { cardId: "card-1", finish: "foil" },
        { aggregateType: "catalog_variant", id: "evt-var-1" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "PriceUpdated",
        "card-1",
        { market: 12.5, currency: "BRL" },
        { aggregateType: "catalog_card", id: "evt-price-1" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "MediaUpdated",
        "card-1",
        { imageUrl: "https://cdn.example/bolt.jpg" },
        { aggregateType: "media_asset", id: "evt-media-1" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "MarketplaceListingUpdated",
        "listing-9",
        { cardId: "card-1", storeId: "store-a", stock: 3, price: 14, finish: "nonfoil" },
        { aggregateType: "listing", id: "evt-list-1" },
      ),
    );

    const doc = await projection.get("card-1");
    expect(doc).not.toBeNull();
    expect(doc!.name).toBe("Lightning Bolt");
    expect(doc!.finishes).toEqual(expect.arrayContaining(["foil", "nonfoil"]));
    expect(doc!.priceMin).toBe(14);
    expect(doc!.storeIds).toContain("store-a");
    expect(doc!.hasStock).toBe(true);
    expect(doc!.imageUrl).toContain("bolt");
    expect(doc!.projection).toBe("cards_v1");
  });

  it("is idempotent via consumer_offsets", async () => {
    const projection = new InMemorySearchProjectionRepository();
    const offsets = new InMemoryConsumerOffsetRepository();
    const consumer = new SearchEventConsumer(projection, offsets);
    const event = createDomainEvent(
      "CardUpdated",
      "c2",
      { name: "Counterspell" },
      { aggregateType: "catalog_card", id: "evt-idem-1" },
    );

    expect(await consumer.handle(event)).toBe("applied");
    expect(await consumer.handle(event)).toBe("skipped");
    expect(await projection.documentCount()).toBe(1);
  });

  it("supports filters: name, oracle, set, language, price, finish, store, stock", async () => {
    const projection = new InMemorySearchProjectionRepository();
    const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());

    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "a",
        {
          name: "Black Lotus",
          normalizedName: "black lotus",
          oracleText: "Add three mana of any one color.",
          setCode: "LEA",
          language: "en",
        },
        { id: "e1", aggregateType: "catalog_card" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "MarketplaceListingUpdated",
        "L1",
        { cardId: "a", storeId: "s1", stock: 1, price: 10000, finish: "nonfoil" },
        { id: "e2", aggregateType: "listing" },
      ),
    );
    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "b",
        { name: "Island", setCode: "LEA", language: "pt", oracleText: "Basic land" },
        { id: "e3", aggregateType: "catalog_card" },
      ),
    );

    const byName = await projection.search({ name: "lotus" });
    expect(byName.hits).toHaveLength(1);

    const byOracle = await projection.search({ oracle: "three mana" });
    expect(byOracle.hits[0]!.document.id).toBe("a");

    const bySet = await projection.search({ setCode: "lea" });
    expect(bySet.estimatedTotal).toBe(2);

    const byLang = await projection.search({ language: "pt" });
    expect(byLang.hits).toHaveLength(1);

    const byPrice = await projection.search({ priceMin: 5000, priceMax: 20000 });
    expect(byPrice.hits.map((h) => h.document.id)).toContain("a");

    const byFinish = await projection.search({ finish: "nonfoil" });
    expect(byFinish.hits).toHaveLength(1);

    const byStore = await projection.search({ storeId: "s1" });
    expect(byStore.hits).toHaveLength(1);

    const byStock = await projection.search({ hasStock: true });
    expect(byStock.hits).toHaveLength(1);
  });

  it("versions cards_v1 → cards_v2 → cards_v3 without sharing docs", async () => {
    const projection = new InMemorySearchProjectionRepository();
    expect(projection.getVersion()).toEqual(createProjectionVersion(1, "live"));

    await projection.beginRebuild(2);
    expect(projection.getVersion().name).toBe("cards_v2");
    expect(projection.getVersion().status).toBe("building");
    expect(await projection.documentCount()).toBe(0);

    await projection.activateProjection();
    expect(projection.getVersion().status).toBe("live");

    await projection.beginRebuild(3);
    expect(projection.getVersion().name).toBe("cards_v3");
  });

  it("ProjectionHealth reflects lag and reachability", () => {
    const healthy = evaluateProjectionHealth({
      projection: "cards_v1",
      lag: { lagMs: 100, lastEventAt: new Date().toISOString(), lastEventId: "e", pendingApprox: 0 },
      indexReachable: true,
    });
    expect(healthy.status).toBe("healthy");

    const degraded = evaluateProjectionHealth({
      projection: "cards_v1",
      lag: { lagMs: 45_000, lastEventAt: new Date().toISOString(), lastEventId: "e", pendingApprox: 0 },
      indexReachable: true,
    });
    expect(degraded.status).toBe("degraded");

    const down = evaluateProjectionHealth({
      projection: "cards_v1",
      lag: { lagMs: 0, lastEventAt: null, lastEventId: null, pendingApprox: 0 },
      indexReachable: false,
    });
    expect(down.status).toBe("down");
  });

  it("builds performance report", async () => {
    const projection = new InMemorySearchProjectionRepository();
    const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());
    await consumer.handle(
      createDomainEvent(
        "CardUpdated",
        "x",
        { name: "Lightning Bolt", normalizedName: "lightning bolt" },
        { id: "perf-1", aggregateType: "catalog_card" },
      ),
    );

    const report = await buildSearchPerformanceReport(projection, [
      { label: "lightning_bolt", q: "Lightning" },
    ]);
    expect(report.projection).toBe("cards_v1");
    expect(report.sampleQueries[0]!.hits).toBeGreaterThanOrEqual(1);
    expect(report.health.status).toBe("healthy");
  });
});
