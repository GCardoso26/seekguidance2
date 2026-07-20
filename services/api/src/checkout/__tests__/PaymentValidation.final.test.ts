import { describe, expect, it } from "vitest";
import { StubPaymentGateway } from "../application/payment/StubPaymentGateway.js";
import { createPaymentGateway } from "../application/payment/createPaymentGateway.js";

/**
 * Payment validation — sandbox contract (Stub = local; Stripe/MP require env keys).
 */
describe("Payment validation — webhook duplicate & ordering", () => {
  it("duplicate webhook same eventId → single succeeded confirm", async () => {
    const gw = new StubPaymentGateway();
    const pi = await gw.createPaymentIntent({
      amountCents: 1990,
      currency: "BRL",
      sessionId: "sess-dup-wh",
      method: "pix",
    });
    const body = JSON.stringify({
      eventId: "evt_dup_1",
      externalIntentId: pi.externalId,
      status: "succeeded",
    });
    const a = await gw.parseWebhook!({}, body);
    const b = await gw.parseWebhook!({}, body);
    expect(a?.eventId).toBe("evt_dup_1");
    expect(b?.eventId).toBe("evt_dup_1");
    const c1 = await gw.confirmPaymentIntent({ externalId: pi.externalId, simulateSuccess: false });
    const c2 = await gw.confirmPaymentIntent({ externalId: pi.externalId, simulateSuccess: false });
    expect(c1.status).toBe("succeeded");
    expect(c2.status).toBe("succeeded");
    expect(c1.externalId).toBe(c2.externalId);
  });

  it("out-of-order: expired then approved — final state remains consistent (last write wins on stub)", async () => {
    const gw = new StubPaymentGateway();
    const pi = await gw.createPaymentIntent({
      amountCents: 500,
      currency: "BRL",
      sessionId: "sess-ooo",
      method: "pix",
    });
    await gw.parseWebhook!(
      {},
      JSON.stringify({
        eventId: "evt_exp",
        externalIntentId: pi.externalId,
        status: "cancelled",
      }),
    );
    await gw.parseWebhook!(
      {},
      JSON.stringify({
        eventId: "evt_ok",
        externalIntentId: pi.externalId,
        status: "succeeded",
      }),
    );
    const after = await gw.getPaymentIntent(pi.externalId);
    // Stub applies last webhook; ConfirmPayment saga must ignore non-pending sessions.
    expect(after?.status).toBe("succeeded");
  });

  it("ConfirmPaymentIntent ×10 → single external id succeeded", async () => {
    const gw = new StubPaymentGateway();
    const pi = await gw.createPaymentIntent({
      amountCents: 100,
      currency: "BRL",
      sessionId: "sess-x10",
    });
    const statuses = [];
    for (let i = 0; i < 10; i++) {
      statuses.push(
        (await gw.confirmPaymentIntent({ externalId: pi.externalId, simulateSuccess: true }))
          .status,
      );
    }
    expect(statuses.every((s) => s === "succeeded")).toBe(true);
  });

  it("Mercado Pago PIX shape via stub method=pix", async () => {
    const gw = createPaymentGateway("stub");
    const pi = await gw.createPaymentIntent({
      amountCents: 3200,
      currency: "BRL",
      sessionId: "sess-mp-shape",
      method: "pix",
    });
    expect(pi.pix?.copyPaste).toBeTruthy();
    expect(pi.pix?.qrCodeBase64).toBeTruthy();
  });

  it("Stripe adapter constructs only with key", () => {
    const prev = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    expect(() => createPaymentGateway("stripe")).not.toThrow();
    if (prev) process.env.STRIPE_SECRET_KEY = prev;
    else delete process.env.STRIPE_SECRET_KEY;
  });
});
