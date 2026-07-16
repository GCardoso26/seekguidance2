import { describe, expect, it } from "vitest";
import { createInMemoryOrderStack } from "../createInMemoryOrderStack.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";

/**
 * Persistence golden path (Sprint 5.3) —
 * Cart → CheckoutSession → Reservation HELD → Order PENDING → Outbox.
 * Sem API / Stripe.
 */
describe("Sprint 5.3 — orderGoldenPath.persistence", () => {
  it("Cart → Checkout → Reservation HELD → Order → Outbox", async () => {
    const stack = createInMemoryOrderStack();
    const buyerId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();
    const inventoryItemId = getIdGenerator().generate();

    const cart = await stack.createCart.execute({ requestId: "gp-1", buyerId });
    await stack.addCartItem.execute({
      requestId: "gp-2",
      cartId: cart.id,
      item: {
        listingId,
        catalogVariantId: getIdGenerator().generate(),
        quantity: 1,
        priceSnapshotCents: 3200,
      },
    });

    const { session, order } = await stack.startCheckout.execute({
      requestId: "gp-3",
      cartId: cart.id,
      buyerId,
    });

    expect(session.status).toBe("CREATED");
    expect(order.status).toBe("PENDING");
    expect(order.totalAmountCents).toBe(3200);

    const hold = await stack.holdReservation.execute({
      requestId: "gp-4",
      listingId,
      inventoryItemId,
      buyerId,
      quantity: 1,
      availableQuantity: 1,
    });
    expect(hold.outcome).toBe("held");
    if (hold.outcome !== "held") return;
    expect(hold.reservation.status).toBe("HELD");

    const claimed = await stack.outbox.claimBatch({
      workerId: "gp-publisher",
      leaseMs: 5_000,
      limit: 20,
    });
    const names = claimed.map((r) => r.eventName);
    expect(names).toContain("CartCreated");
    expect(names).toContain("CartItemAdded");
    expect(names).toContain("CheckoutStarted");
    expect(names).toContain("OrderCreated");
    expect(names).toContain("ReservationHeld");
    expect(await stack.outbox.countByStatus("dead")).toBe(0);
  });
});
