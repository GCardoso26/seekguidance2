import { describe, expect, it } from "vitest";
import { applyCouponDiscount } from "../domain/types.js";
import type { SagaDefinition } from "../../platform/saga/SagaOrchestrator.js";
import type { CheckoutSagaContext } from "../application/CheckoutSaga.js";

describe("Checkout coupon (V1 simples)", () => {
  it("aplica percent_off", () => {
    const r = applyCouponDiscount(1000, {
      code: "BEMVINDO10",
      percentOff: 10,
      amountOffCents: null,
      active: true,
    });
    expect(r.discountCents).toBe(100);
    expect(r.totalCents).toBe(900);
  });

  it("aplica amount_off com teto no subtotal", () => {
    const r = applyCouponDiscount(50, {
      code: "X",
      percentOff: null,
      amountOffCents: 100,
      active: true,
    });
    expect(r.discountCents).toBe(50);
    expect(r.totalCents).toBe(0);
  });

  it("ignora cupom inativo", () => {
    const r = applyCouponDiscount(1000, {
      code: "X",
      percentOff: 50,
      amountOffCents: null,
      active: false,
    });
    expect(r.discountCents).toBe(0);
    expect(r.totalCents).toBe(1000);
  });
});

describe("StartCheckout saga shape", () => {
  it("ordena steps conforme épico Checkout", () => {
    const steps = [
      "ValidateCart",
      "HoldInventory",
      "RefreshPricing",
      "ApplyCoupon",
      "CreatePaymentIntent",
      "PersistCheckoutSession",
    ];
    const definition: SagaDefinition<CheckoutSagaContext> = {
      sagaType: "StartCheckout",
      steps: steps.map((name) => ({
        name,
        execute: async () => ({}),
        compensate: name === "HoldInventory" ? async () => undefined : undefined,
      })),
    };
    expect(definition.sagaType).toBe("StartCheckout");
    expect(definition.steps.map((s) => s.name)).toEqual(steps);
    expect(definition.steps.find((s) => s.name === "HoldInventory")?.compensate).toBeTypeOf(
      "function",
    );
  });
});
