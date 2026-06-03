import { describe, expect, it } from "vitest";
import { COMPARISON_ROWS, PRICING_FAQS, PRICING_PLANS } from "@/lib/pricing-plans";

describe("pricing-plans", () => {
  it("define 3 planos free/pro/team", () => {
    expect(PRICING_PLANS).toHaveLength(3);
    expect(PRICING_PLANS.map((p) => p.id)).toEqual(["free", "pro", "team"]);
  });

  it("plano pro é o popular", () => {
    const pro = PRICING_PLANS.find((p) => p.id === "pro");
    expect(pro?.popular).toBe(true);
    expect(pro?.priceMonthly).toBe(19.9);
    expect(pro?.priceAnnual).toBe(199);
  });

  it("comparativo cobre recursos principais", () => {
    expect(COMPARISON_ROWS.length).toBeGreaterThanOrEqual(7);
    expect(PRICING_FAQS.length).toBeGreaterThanOrEqual(5);
  });
});
