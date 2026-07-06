import { describe, expect, it } from "vitest";
import { sellerIntelligenceMock } from "@/lib/seller-intelligence-mock";

describe("intelligence mocks", () => {
  it("has sales summary", () => {
    expect(sellerIntelligenceMock().sales.summary.orders).toBeGreaterThan(0);
  });

  it("has pricing suggestions", () => {
    expect(sellerIntelligenceMock().pricing_suggestions.length).toBeGreaterThan(0);
  });
});
