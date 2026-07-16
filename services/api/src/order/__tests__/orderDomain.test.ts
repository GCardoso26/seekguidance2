import { describe, expect, it } from "vitest";
import { createInMemoryOrderStack } from "../createInMemoryOrderStack.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { cartTotalCents } from "../domain/models.js";

describe("Sprint 5.1 — Order Domain", () => {
  it("Cart holds price snapshot — never re-reads Listing", async () => {
    const stack = createInMemoryOrderStack();
    const buyerId = getIdGenerator().generate();
    const listingId = getIdGenerator().generate();
    const variantId = getIdGenerator().generate();

    const cart = await stack.createCart.execute({ requestId: "r1", buyerId });
    expect(cart.status).toBe("open");

    const withItem = await stack.addCartItem.execute({
      requestId: "r2",
      cartId: cart.id,
      item: {
        listingId,
        catalogVariantId: variantId,
        quantity: 2,
        priceSnapshotCents: 1990,
      },
    });
    expect(withItem.items).toHaveLength(1);
    expect(withItem.items[0]!.priceSnapshotCents).toBe(1990);
    expect(cartTotalCents(withItem)).toBe(3980);

    // Adding same listing again keeps original snapshot (frozen).
    const again = await stack.addCartItem.execute({
      requestId: "r3",
      cartId: cart.id,
      item: {
        listingId,
        catalogVariantId: variantId,
        quantity: 1,
        priceSnapshotCents: 9999, // would-be new listing price — ignored for existing line
      },
    });
    expect(again.items[0]!.quantity).toBe(3);
    expect(again.items[0]!.priceSnapshotCents).toBe(1990);

    // Idempotent open cart per buyer
    const same = await stack.createCart.execute({ requestId: "r4", buyerId });
    expect(same.id).toBe(cart.id);
  });

  it("Checkout freezes cart into Order; total from snapshots only", async () => {
    const stack = createInMemoryOrderStack();
    const buyerId = getIdGenerator().generate();
    const cart = await stack.createCart.execute({ requestId: "c1", buyerId });
    await stack.addCartItem.execute({
      requestId: "c2",
      cartId: cart.id,
      item: {
        listingId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        quantity: 1,
        priceSnapshotCents: 2500,
      },
    });
    await stack.addCartItem.execute({
      requestId: "c3",
      cartId: cart.id,
      item: {
        listingId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        quantity: 2,
        priceSnapshotCents: 1000,
      },
    });

    const { session, order } = await stack.startCheckout.execute({
      requestId: "c4",
      cartId: cart.id,
      buyerId,
    });

    expect(session.status).toBe("CREATED");
    expect(session.orderId).toBe(order.id);
    expect(order.status).toBe("PENDING");
    expect(order.totalAmountCents).toBe(4500); // 2500 + 2*1000
    expect(order.items).toHaveLength(2);
    // Order items are snapshots — no name/oracle
    expect(order.items[0]).not.toHaveProperty("name");
    expect(order).not.toHaveProperty("listing");

    const closed = await stack.tx.runInTransaction((t) => stack.carts.findById(t, cart.id));
    expect(closed?.status).toBe("checked_out");

    const claimed = await stack.outbox.claimBatch({
      workerId: "w1",
      leaseMs: 1000,
      limit: 20,
    });
    expect(claimed.some((r) => r.eventName === "CheckoutStarted")).toBe(true);
    expect(claimed.some((r) => r.eventName === "OrderCreated")).toBe(true);
  });

  it("Checkout freezes cart into Order; payment completion is Payment BC (5.5)", async () => {
    const stack = createInMemoryOrderStack();
    const buyerId = getIdGenerator().generate();
    const cart = await stack.createCart.execute({ requestId: "p1", buyerId });
    await stack.addCartItem.execute({
      requestId: "p2",
      cartId: cart.id,
      item: {
        listingId: getIdGenerator().generate(),
        catalogVariantId: getIdGenerator().generate(),
        quantity: 1,
        priceSnapshotCents: 1500,
      },
    });
    const { session, order } = await stack.startCheckout.execute({
      requestId: "p3",
      cartId: cart.id,
      buyerId,
    });
    expect(session.status).toBe("CREATED");
    expect(order.status).toBe("PENDING");
    expect(order.totalAmountCents).toBe(1500);
    // Sync Fake charge removed — Order PAID via webhook settlement (Sprint 5.5).
    expect(stack).toHaveProperty("settlePayment");
    expect(stack).not.toHaveProperty("payOrder");
  });

  it("Reservation holds stock without mutating Inventory aggregate", async () => {
    const stack = createInMemoryOrderStack();
    const inventoryItemId = getIdGenerator().generate();
    const reservation = await stack.tx.runInTransaction((t) =>
      stack.reservations.create(t, {
        listingId: getIdGenerator().generate(),
        inventoryItemId,
        buyerId: getIdGenerator().generate(),
        quantity: 1,
        ttlMs: 60_000,
      }),
    );
    expect(reservation.status).toBe("HELD");
    expect(await stack.tx.runInTransaction((t) =>
      stack.reservations.heldQuantityForInventory(t, inventoryItemId),
    )).toBe(1);

    await stack.tx.runInTransaction((t) =>
      stack.reservations.updateStatus(t, reservation.id, "RELEASED"),
    );
    expect(await stack.tx.runInTransaction((t) =>
      stack.reservations.heldQuantityForInventory(t, inventoryItemId),
    )).toBe(0);
  });

  it("Order never mutates Listing — references only", async () => {
    const stack = createInMemoryOrderStack();
    const listingId = getIdGenerator().generate();
    const buyerId = getIdGenerator().generate();
    const cart = await stack.createCart.execute({ requestId: "l1", buyerId });
    await stack.addCartItem.execute({
      requestId: "l2",
      cartId: cart.id,
      item: {
        listingId,
        catalogVariantId: getIdGenerator().generate(),
        quantity: 1,
        priceSnapshotCents: 100,
      },
    });
    const { order } = await stack.startCheckout.execute({
      requestId: "l3",
      cartId: cart.id,
      buyerId,
    });
    expect(order.items[0]!.listingId).toBe(listingId);
    // No write path to marketplace listings from order stack.
    expect(stack).not.toHaveProperty("listings");
    expect(stack).not.toHaveProperty("publishListing");
  });
});
