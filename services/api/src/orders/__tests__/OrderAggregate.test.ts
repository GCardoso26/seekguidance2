import { describe, expect, it } from "vitest";
import { OrderAggregate } from "../domain/OrderAggregate.js";

describe("OrderAggregate", () => {
  it("cria PAID com timeline OrderCreated + PaymentApproved", () => {
    const order = OrderAggregate.create({
      buyerId: "b1",
      sellerId: "s1",
      checkoutSessionId: "sess-1",
      checkoutPaymentId: "pay-1",
      subtotalCents: 1000,
      totalCents: 900,
      discountCents: 100,
      alreadyPaid: true,
      items: [
        {
          listingId: "L1",
          quantity: 2,
          unitPriceCents: 500,
        },
      ],
    });
    const snap = order.snapshot();
    expect(snap.status).toBe("PAID");
    expect(snap.paymentStatus).toBe("paid");
    expect(snap.items[0]!.totalCents).toBe(1000);
    const timeline = order.drainTimeline();
    expect(timeline.map((t) => t.eventType)).toEqual(["OrderCreated", "PaymentApproved"]);
  });

  it("transições PROCESSING → SHIPPED → DELIVERED", () => {
    const order = OrderAggregate.create({
      buyerId: "b1",
      checkoutSessionId: "sess-2",
      subtotalCents: 100,
      totalCents: 100,
      alreadyPaid: true,
      items: [{ quantity: 1, unitPriceCents: 100, listingId: "L" }],
    });
    order.drainTimeline();
    order.markProcessing();
    order.markShipped("SHIP-1");
    order.markDelivered();
    expect(order.snapshot().status).toBe("DELIVERED");
    expect(order.snapshot().shipmentRef).toBe("SHIP-1");
  });

  it("não cancela DELIVERED", () => {
    const order = OrderAggregate.create({
      buyerId: "b1",
      checkoutSessionId: "sess-3",
      subtotalCents: 100,
      totalCents: 100,
      alreadyPaid: true,
      items: [{ quantity: 1, unitPriceCents: 100 }],
    });
    order.drainTimeline();
    order.markProcessing();
    order.markShipped();
    order.markDelivered();
    expect(() => order.cancel()).toThrow(/order_cannot_cancel_delivered|order_terminal/);
  });
});
