import { describe, expect, it } from "vitest";
import { calculateEscrowFees, canTransition, planEscrowAutoActions } from "@/lib/escrow/escrow-service";

describe("calculateEscrowFees", () => {
  it("aplica taxa de 3% sobre o subtotal", () => {
    const fees = calculateEscrowFees(10000, 1500);
    expect(fees.escrowFeeCents).toBe(300);
    expect(fees.totalCents).toBe(11800);
  });
});

describe("canTransition", () => {
  it("permite pagamento recebido após pendente", () => {
    expect(canTransition("pending_payment", "payment_received")).toBe(true);
    expect(canTransition("pending_payment", "shipped")).toBe(false);
  });
});

describe("planEscrowAutoActions", () => {
  it("cancela pagamentos expirados", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const plan = planEscrowAutoActions([
      {
        id: "a",
        status: "pending_payment",
        payment_deadline: past,
        shipping_deadline: null,
        confirmation_deadline: null,
        auto_release_at: null,
      },
    ]);
    expect(plan.cancelIds).toEqual(["a"]);
  });
});
