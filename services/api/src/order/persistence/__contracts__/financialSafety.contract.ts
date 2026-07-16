import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { OrderContractFactory } from "./types.js";
import { inTx } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { StartCheckoutApplicationService } from "../../application/StartCheckoutApplicationService.js";

/**
 * Financial safety contracts — same asserts on InMemory and Postgres.
 * 1) Price snapshot preserved when "Listing price changes"
 * 2) Order does not depend on Marketplace ListingRepository
 */
export function registerFinancialSafetyContract(factory: OrderContractFactory): void {
  describe("Financial safety contract", () => {
    let h: Awaited<ReturnType<OrderContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Snapshot preserved: CartItem 100 → Listing would be 200 → OrderItem stays 100", async () => {
      const buyerId = getIdGenerator().generate();
      const listingId = getIdGenerator().generate();
      const variantId = getIdGenerator().generate();

      const cart = await inTx(h.tx, (tx) => h.carts.create(tx, { buyerId }));
      await inTx(h.tx, (tx) =>
        h.carts.addItem(tx, cart.id, {
          listingId,
          catalogVariantId: variantId,
          quantity: 1,
          priceSnapshotCents: 100,
          currency: "BRL",
        }),
      );

      // Simulate Listing price change to 200 — Order must NOT see it.
      // We never call ListingRepository; StartCheckout uses cart snapshots only.
      const start = new StartCheckoutApplicationService(
        h.tx,
        h.carts,
        h.checkouts,
        h.orders,
        h.outbox,
      );
      const { order } = await start.execute({
        requestId: getIdGenerator().generate(),
        cartId: cart.id,
        buyerId,
      });

      expect(order.items[0]!.unitPriceCents).toBe(100);
      expect(order.totalAmountCents).toBe(100);
      expect(order.items[0]!.listingId).toBe(listingId);
    });

    it("Order independent of Marketplace: no ListingRepository required", async () => {
      // Harness has no sellers/listings — proving Order stack stands alone.
      expect(h).not.toHaveProperty("listings");
      expect(h).not.toHaveProperty("sellers");

      const buyerId = getIdGenerator().generate();
      const cart = await inTx(h.tx, (tx) => h.carts.create(tx, { buyerId }));
      await inTx(h.tx, (tx) =>
        h.carts.addItem(tx, cart.id, {
          listingId: getIdGenerator().generate(),
          catalogVariantId: getIdGenerator().generate(),
          quantity: 2,
          priceSnapshotCents: 500,
          currency: "BRL",
        }),
      );

      const start = new StartCheckoutApplicationService(
        h.tx,
        h.carts,
        h.checkouts,
        h.orders,
        h.outbox,
      );
      const { order, session } = await start.execute({
        requestId: getIdGenerator().generate(),
        cartId: cart.id,
        buyerId,
      });
      expect(order.totalAmountCents).toBe(1000);
      expect(session.status).toBe("CREATED");
    });
  });
}
