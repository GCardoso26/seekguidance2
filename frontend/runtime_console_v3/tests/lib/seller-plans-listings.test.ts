import { describe, expect, it } from "vitest";
import { canCreateListing, planHasFeature } from "@/lib/seller-plans";

describe("planHasFeature listings", () => {
  it("listings disponível em todos os planos", () => {
    expect(planHasFeature("free", "listings")).toBe(true);
    expect(planHasFeature("pro", "listings")).toBe(true);
  });
});

describe("canCreateListing", () => {
  it("bloqueia free no limite de 50", () => {
    expect(canCreateListing("free", 49)).toBe(true);
    expect(canCreateListing("free", 50)).toBe(false);
  });

  it("enterprise sem limite", () => {
    expect(canCreateListing("enterprise", 99999)).toBe(true);
  });
});
