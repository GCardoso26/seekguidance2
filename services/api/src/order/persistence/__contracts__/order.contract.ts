import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { OrderContractFactory } from "./types.js";
import { inTx } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

export function registerOrderRepositoryContract(factory: OrderContractFactory): void {
  describe("OrderRepository contract", () => {
    let h: Awaited<ReturnType<OrderContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / Update status / Optimistic lock", async () => {
      const buyerId = getIdGenerator().generate();
      const sessionId = getIdGenerator().generate();
      const order = await inTx(h.tx, (tx) =>
        h.orders.create(tx, {
          buyerId,
          checkoutSessionId: sessionId,
          items: [
            {
              listingId: getIdGenerator().generate(),
              catalogVariantId: getIdGenerator().generate(),
              quantity: 2,
              unitPriceCents: 1000,
              currency: "BRL",
            },
          ],
        }),
      );
      expect(order.status).toBe("PENDING");
      expect(order.totalAmountCents).toBe(2000);
      expect(order.items[0]).not.toHaveProperty("name");

      const paid = await inTx(h.tx, (tx) =>
        h.orders.updateStatus(tx, order.id, "PAID", order.rowVersion),
      );
      expect(paid.status).toBe("PAID");
      expect(paid.rowVersion).toBe(order.rowVersion + 1);

      await expect(
        inTx(h.tx, (tx) => h.orders.updateStatus(tx, order.id, "FULFILLED", 1)),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards order", async () => {
      const id = getIdGenerator().generate();
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.orders.create(tx, {
            id,
            buyerId: getIdGenerator().generate(),
            checkoutSessionId: getIdGenerator().generate(),
            items: [
              {
                listingId: getIdGenerator().generate(),
                catalogVariantId: getIdGenerator().generate(),
                quantity: 1,
                unitPriceCents: 500,
                currency: "BRL",
              },
            ],
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.orders.findById(tx, id));
      expect(found).toBeNull();
    });
  });
}
