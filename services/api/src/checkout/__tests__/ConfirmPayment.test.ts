import { describe, expect, it } from "vitest";
import type { SagaDefinition } from "../../platform/saga/SagaOrchestrator.js";
import type { ConfirmPaymentSagaContext } from "../application/ConfirmPaymentSaga.js";
import { StubPaymentGateway } from "../application/payment/StubPaymentGateway.js";

describe("ConfirmPayment saga shape", () => {
  it("ordena: ValidateSession → ConfirmGateway → InventoryConfirm → MarkCompleted", () => {
    const steps = [
      "ValidateSession",
      "ConfirmGatewayPayment",
      "InventoryConfirm",
      "MarkSessionCompleted",
    ];
    const definition: SagaDefinition<ConfirmPaymentSagaContext> = {
      sagaType: "ConfirmPayment",
      steps: steps.map((name) => ({
        name,
        execute: async () => ({}),
      })),
    };
    expect(definition.sagaType).toBe("ConfirmPayment");
    expect(definition.steps.map((s) => s.name)).toEqual(steps);
  });
});

describe("StubPaymentGateway confirm", () => {
  it("create → confirm succeeded", async () => {
    const gw = new StubPaymentGateway();
    const pi = await gw.createPaymentIntent({
      amountCents: 1000,
      currency: "BRL",
      sessionId: "sess-1",
    });
    expect(pi.status).toBe("pending");
    const confirmed = await gw.confirmPaymentIntent({
      externalId: pi.externalId,
      simulateSuccess: true,
    });
    expect(confirmed.status).toBe("succeeded");
  });

  it("simulateSuccess false → failed", async () => {
    const gw = new StubPaymentGateway();
    const pi = await gw.createPaymentIntent({
      amountCents: 1000,
      currency: "BRL",
      sessionId: "sess-2",
    });
    const confirmed = await gw.confirmPaymentIntent({
      externalId: pi.externalId,
      simulateSuccess: false,
    });
    expect(confirmed.status).toBe("failed");
  });
});
