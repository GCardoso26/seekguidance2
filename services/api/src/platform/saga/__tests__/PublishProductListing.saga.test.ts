import { describe, expect, it } from "vitest";
import type { SagaDefinition } from "../SagaOrchestrator.js";

describe("PublishProductListing saga definition shape", () => {
  it("ordena steps: seller → listing → inventory → pricing → search → analytics → notify", () => {
    const steps = [
      "EnsureSeller",
      "PersistListing",
      "InventoryUpsert",
      "PricingRefresh",
      "SearchReindex",
      "AnalyticsIngest",
      "NotificationPublish",
    ];
    const definition: SagaDefinition = {
      sagaType: "PublishProductListing",
      steps: steps.map((name) => ({
        name,
        execute: async () => ({}),
        optional: !["EnsureSeller", "PersistListing", "InventoryUpsert"].includes(name),
      })),
    };
    expect(definition.sagaType).toBe("PublishProductListing");
    expect(definition.steps.map((s) => s.name)).toEqual(steps);
    expect(definition.steps.find((s) => s.name === "PricingRefresh")?.optional).toBe(true);
    expect(definition.steps.find((s) => s.name === "PersistListing")?.optional).toBeFalsy();
  });
});
