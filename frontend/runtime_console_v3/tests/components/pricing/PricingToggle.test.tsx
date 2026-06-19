import { describe, expect, it } from "vitest";
import { PRICING_PLANS } from "@/lib/pricing-plans";

describe("PricingToggle behaviour", () => {
  it("toggle anual altera preço exibido do plano pro", () => {
    const pro = PRICING_PLANS.find((p) => p.id === "pro");
    expect(pro).toBeDefined();
    const monthly = pro!.priceMonthly;
    const annualPerMonth = pro!.priceAnnual / 12;
    expect(annualPerMonth).toBeLessThan(monthly);
    expect(pro!.priceMonthly * 12 - pro!.priceAnnual).toBeCloseTo(58, 1);
  });
});
