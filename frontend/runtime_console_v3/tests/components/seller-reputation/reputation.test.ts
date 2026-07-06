import { describe, expect, it } from "vitest";
import { sellerReputationMock, sellerReputationOverviewMock } from "@/lib/seller-reputation-mock";

describe("reputation mocks", () => {
  it("reputation mock has trust score", () => {
    expect(sellerReputationMock().trust_score).toBeGreaterThan(0);
  });

  it("overview mock has level", () => {
    expect(sellerReputationOverviewMock().seller_level).toBeTruthy();
  });
});
