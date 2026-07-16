import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { OrderContractFactory } from "./types.js";
import { inTx } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

export function registerCartRepositoryContract(factory: OrderContractFactory): void {
  describe("CartRepository contract", () => {
    let h: Awaited<ReturnType<OrderContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / add item / checkout", async () => {
      const buyerId = getIdGenerator().generate();
      const cart = await inTx(h.tx, (tx) => h.carts.create(tx, { buyerId }));
      expect(cart.status).toBe("open");
      expect(cart.rowVersion).toBe(1);

      const withItem = await inTx(h.tx, (tx) =>
        h.carts.addItem(tx, cart.id, {
          listingId: getIdGenerator().generate(),
          catalogVariantId: getIdGenerator().generate(),
          quantity: 2,
          priceSnapshotCents: 1500,
          currency: "BRL",
        }),
      );
      expect(withItem.items).toHaveLength(1);
      expect(withItem.items[0]!.priceSnapshotCents).toBe(1500);
      expect(withItem.rowVersion).toBeGreaterThan(1);

      const checked = await inTx(h.tx, (tx) =>
        h.carts.markCheckedOut(tx, cart.id, withItem.rowVersion),
      );
      expect(checked.status).toBe("checked_out");
    });

    it("Optimistic lock on checkout", async () => {
      const buyerId = getIdGenerator().generate();
      const cart = await inTx(h.tx, (tx) => h.carts.create(tx, { buyerId }));
      await expect(
        inTx(h.tx, (tx) => h.carts.markCheckedOut(tx, cart.id, 99)),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards cart", async () => {
      const buyerId = getIdGenerator().generate();
      let cartId = "";
      await expect(
        h.tx.runInTransaction(async (tx) => {
          const cart = await h.carts.create(tx, { buyerId });
          cartId = cart.id;
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.carts.findById(tx, cartId));
      expect(found).toBeNull();
    });

    it("Idempotent open cart per buyer (application-level via findOpen)", async () => {
      const buyerId = getIdGenerator().generate();
      const a = await inTx(h.tx, (tx) => h.carts.create(tx, { buyerId }));
      const open = await inTx(h.tx, (tx) => h.carts.findOpenByBuyer(tx, buyerId));
      expect(open?.id).toBe(a.id);
    });
  });
}
