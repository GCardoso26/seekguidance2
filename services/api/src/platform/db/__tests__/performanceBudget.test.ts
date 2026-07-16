import { describe, expect, it } from "vitest";
import { PERFORMANCE_BUDGET } from "../databaseCertification.js";

describe("Performance budget (frozen)", () => {
  it("defines positive budgets for critical operations", () => {
    expect(PERFORMANCE_BUDGET.persistCardMs).toBeLessThanOrEqual(20);
    expect(PERFORMANCE_BUDGET.persistVariantMs).toBeLessThanOrEqual(10);
    expect(PERFORMANCE_BUDGET.publishOutboxMs).toBeLessThanOrEqual(100);
    expect(PERFORMANCE_BUDGET.claimOutboxMs).toBeLessThanOrEqual(1_000);
    expect(PERFORMANCE_BUDGET.searchProjectionMs).toBeLessThanOrEqual(5_000);
    expect(PERFORMANCE_BUDGET.shadowSync10kCardsMinutes).toBeGreaterThan(0);
  });
});
