import { describe, expect, it } from "vitest";
import { shouldAlert } from "@/lib/wishlist-price-alert";
import type { WishlistPriceAlert } from "@/types/wishlist-price-alert";

const base: Pick<
  WishlistPriceAlert,
  "alert_type" | "target_price" | "percentage" | "is_active"
> = {
  alert_type: "any_drop",
  target_price: null,
  percentage: null,
  is_active: true,
};

describe("shouldAlert", () => {
  it("any_drop dispara quando preço cai", () => {
    expect(shouldAlert(1800, 2000, { ...base, alert_type: "any_drop" })).toBe(true);
  });

  it("não alerta quando preço sobe", () => {
    expect(shouldAlert(2200, 2000, { ...base, alert_type: "any_drop" })).toBe(false);
  });

  it("não alerta quando preço permanece igual", () => {
    expect(shouldAlert(2000, 2000, { ...base, alert_type: "any_drop" })).toBe(false);
  });

  it("target_price dispara quando preço atual <= alvo", () => {
    expect(
      shouldAlert(1500, 2000, {
        ...base,
        alert_type: "target_price",
        target_price: 1600,
      }),
    ).toBe(true);
  });

  it("target_price não dispara se ainda acima do alvo", () => {
    expect(
      shouldAlert(1700, 2000, {
        ...base,
        alert_type: "target_price",
        target_price: 1500,
      }),
    ).toBe(false);
  });

  it("percentage_drop dispara na queda mínima", () => {
    expect(
      shouldAlert(1800, 2000, {
        ...base,
        alert_type: "percentage_drop",
        percentage: 10,
      }),
    ).toBe(true);
  });

  it("percentage_drop não dispara abaixo do limiar", () => {
    expect(
      shouldAlert(1950, 2000, {
        ...base,
        alert_type: "percentage_drop",
        percentage: 10,
      }),
    ).toBe(false);
  });

  it("não alerta quando is_active é false", () => {
    expect(shouldAlert(1000, 2000, { ...base, is_active: false })).toBe(false);
  });
});
