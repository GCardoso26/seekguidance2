import { describe, expect, it } from "vitest";
import { domainEventFactory } from "../DomainEventFactory.js";
import { eventRegistry } from "../EventRegistry.js";

describe("DomainEventFactory + EventRegistry (ADR-008/010)", () => {
  it("cria evento versionado registrado", () => {
    const ev = domainEventFactory.create({
      eventType: "PriceChanged",
      version: 1,
      aggregateId: "agg-1",
      aggregateType: "product_variant",
      payload: { min: 100, suggested: 120 },
      correlationId: "corr-1",
    });
    expect(ev.eventType).toBe("PriceChanged.v1");
    expect(ev.version).toBe(1);
    expect(ev.eventId).toBeTruthy();
    expect(ev.correlationId).toBe("corr-1");
  });

  it("rejeita evento não registrado", () => {
    expect(() =>
      domainEventFactory.create({
        eventType: "UnknownThing.v1",
        aggregateId: "x",
        aggregateType: "x",
        payload: {},
      }),
    ).toThrow(/unregistered_event/);
  });

  it("lista eventos frozen no registry", () => {
    const list = eventRegistry.list();
    expect(list.some((e) => e.eventType === "SagaCompleted.v1")).toBe(true);
    expect(list.every((e) => e.frozen)).toBe(true);
  });

  it("roundtrip legacy bridge", () => {
    const ev = domainEventFactory.create({
      eventType: "MarketplaceListingPublished.v1",
      aggregateId: "listing-1",
      aggregateType: "listing",
      payload: { action: "search.reindex" },
    });
    const legacy = domainEventFactory.toLegacy(ev);
    const back = domainEventFactory.fromLegacy(legacy);
    expect(back.eventType).toBe("MarketplaceListingPublished.v1");
    expect(back.aggregateId).toBe("listing-1");
  });
});
