import { describe, expect, it } from "vitest";
import { createDomainEvent } from "../../shared/events/types.js";
import { getHashPort } from "../../shared/hash/HashPort.js";
import { EventBus } from "../../platform/event-bus/EventBus.js";
import {
  ProviderRegistry,
  CATALOG_CAPABILITIES_NO_PRICES,
} from "../registry/ProviderRegistry.js";
import { MemoryFlagStore } from "../../platform/feature-flags/FlagStore.js";
import { renderCard } from "../../marketplace/RenderedCard.js";
import { SearchSyncWorker } from "../../search/SearchSyncWorker.js";
import { simplePerceptualHash } from "../../media/MediaService.js";
import { PRIORITY_WEIGHT, dlqName, QUEUE_NAMES } from "../../platform/bullmq/queues.js";
import { mapCardFinishes } from "./helpers.js";
import { eventBus } from "../../platform/event-bus/EventBus.js";

describe("DomainEvent envelope", () => {
  it("includes eventType, EventMetadata versions, correlationId", () => {
    const ev = createDomainEvent(
      "CardUpdated",
      "card-1",
      { name: "Sol Ring" },
      { eventVersion: 1, schemaVersion: 1, aggregateType: "catalog_card" },
    );
    expect(ev.eventType).toBe("CardUpdated");
    expect(ev.metadata.eventVersion).toBe(1);
    expect(ev.metadata.schemaVersion).toBe(1);
    expect(ev.aggregateId).toBe("card-1");
    expect(ev.metadata.correlationId).toBeTruthy();
    expect(ev.metadata.requestId).toBeTruthy();
    expect(ev.metadata.occurredAt).toBeTruthy();
  });
});

describe("EventBus pub/sub", () => {
  it("does not couple producer to consumer", async () => {
    const bus = new EventBus();
    const seen: string[] = [];
    bus.subscribe("CardUpdated", (e) => {
      seen.push(e.aggregateId);
    });
    bus.subscribe("*", (e) => {
      seen.push(`*:${e.eventType}`);
    });
    await bus.publish(
      createDomainEvent("CardUpdated", "abc", {}, { aggregateType: "catalog_card" }),
    );
    expect(seen).toContain("abc");
    expect(seen).toContain("*:CardUpdated");
  });
});

describe("ProviderRegistry", () => {
  it("respects OFF / CANARY / capabilities / cost", () => {
    const reg = new ProviderRegistry();
    reg.register({
      providerId: "scryfall",
      gameCode: "MTG",
      kind: "catalog",
      capabilities: { ...CATALOG_CAPABILITIES_NO_PRICES },
      mode: "OFF",
      canaryPercent: 0,
      health: { status: "unknown" },
      statistics: { requestsToday: 0, requestsTotal: 0, syncCardsTotal: 0, syncErrorsTotal: 0 },
    });
    expect(reg.shouldRun(reg.get("scryfall", "MTG")!)).toBe(false);
    expect(reg.supports("scryfall", "MTG", "prices")).toBe(false);
    expect(reg.supports("scryfall", "MTG", "rulings")).toBe(true);

    const p = reg.get("scryfall", "MTG")!;
    p.mode = "CANARY";
    p.canaryPercent = 0;
    expect(reg.shouldRun(p, 50)).toBe(false);
    p.canaryPercent = 100;
    expect(reg.shouldRun(p, 50)).toBe(true);

    reg.addCost("scryfall", "MTG", 0.02);
    expect(reg.get("scryfall", "MTG")!.statistics.dailyCost).toBeCloseTo(0.02);
  });
});

describe("Feature flags", () => {
  it("can disable rulings for a provider without turning it OFF", () => {
    const flags = new MemoryFlagStore();
    flags.set("provider", "enable_rulings", false, "scryfall");
    expect(flags.isEnabled("provider", "enable_rulings", "scryfall")).toBe(false);
    expect(flags.isEnabled("provider", "enable_images", "scryfall")).toBe(true);
  });
});

describe("RenderedCard", () => {
  it("overlays listing without mutating official name storage", () => {
    const rendered = renderCard(
      {
        catalogCardId: "1",
        name: "Lightning Bolt",
        imageUrl: "https://cdn.example/official.webp",
      },
      {
        listingId: "L1",
        listingTitle: "Bolt NM — promo art",
        sellerPhotoUrls: ["https://cdn.example/seller.jpg"],
        priceCents: 1990,
        currency: "BRL",
        quantity: 2,
        condition: "NM",
      },
    );
    expect(rendered.official.name).toBe("Lightning Bolt");
    expect(rendered.displayName).toBe("Bolt NM — promo art");
    expect(rendered.displayImages[0]).toContain("seller");
  });
});

describe("SearchSyncWorker multi-event + projection version", () => {
  it("indexes multiple event types into projection", async () => {
    const worker = new SearchSyncWorker();
    worker.start();
    await eventBus.publish(
      createDomainEvent("CardUpdated", "c1", { name: "A" }, { aggregateType: "catalog_card" }),
    );
    await eventBus.publish(
      createDomainEvent("PriceUpdated", "c1", { market: 1.2 }, { aggregateType: "catalog_card" }),
    );
    await eventBus.publish(
      createDomainEvent(
        "MarketplaceListingUpdated",
        "L9",
        { cardId: "c1" },
        { aggregateType: "listing" },
      ),
    );
    expect(worker.documentCount()).toBeGreaterThanOrEqual(1);
    const doc = await worker.getRepository().get("c1");
    expect(doc?.name).toBe("A");
    expect(doc?.priceMin).toBe(1.2);
    const next = worker.beginRebuild(2);
    expect(next.name).toBe("cards_v2");
    expect(next.status).toBe("building");
    worker.stop();
  });
});

describe("Media hashes", () => {
  it("computes sha256 and perceptual via HashPort", () => {
    const buf = Buffer.from("fake-image-bytes-aaaa");
    const hashes = getHashPort();
    expect(hashes.sha256(buf)).toHaveLength(64);
    expect(hashes.perceptual(buf)).toHaveLength(16);
    expect(simplePerceptualHash(buf)).toHaveLength(16);
  });
});

describe("BullMQ queue naming", () => {
  it("has dlq and priority weights", () => {
    expect(dlqName(QUEUE_NAMES.catalogCards)).toBe("catalog.cards.dlq");
    expect(PRIORITY_WEIGHT.HIGH).toBeLessThan(PRIORITY_WEIGHT.LOW);
  });
});

describe("helpers", () => {
  it("mapCardFinishes is stable", () => {
    expect(mapCardFinishes(["foil", "nonfoil"])).toEqual(["foil", "nonfoil"]);
  });
});
