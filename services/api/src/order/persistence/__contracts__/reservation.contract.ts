import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { OrderContractFactory } from "./types.js";
import { inTx } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

export function registerReservationRepositoryContract(factory: OrderContractFactory): void {
  describe("InventoryReservationRepository contract", () => {
    let h: Awaited<ReturnType<OrderContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert HELD / Confirm / heldQuantity", async () => {
      const inventoryItemId = getIdGenerator().generate();
      const reservation = await inTx(h.tx, (tx) =>
        h.reservations.create(tx, {
          listingId: getIdGenerator().generate(),
          inventoryItemId,
          buyerId: getIdGenerator().generate(),
          quantity: 2,
          ttlMs: 60_000,
        }),
      );
      expect(reservation.status).toBe("HELD");
      expect(
        await inTx(h.tx, (tx) => h.reservations.heldQuantityForInventory(tx, inventoryItemId)),
      ).toBe(2);

      const confirmed = await inTx(h.tx, (tx) =>
        h.reservations.updateStatus(tx, reservation.id, "CONFIRMED", reservation.rowVersion),
      );
      expect(confirmed.status).toBe("CONFIRMED");
      expect(
        await inTx(h.tx, (tx) => h.reservations.heldQuantityForInventory(tx, inventoryItemId)),
      ).toBe(0);
    });

    it("Optimistic lock", async () => {
      const reservation = await inTx(h.tx, (tx) =>
        h.reservations.create(tx, {
          listingId: getIdGenerator().generate(),
          inventoryItemId: getIdGenerator().generate(),
          buyerId: getIdGenerator().generate(),
          quantity: 1,
          ttlMs: 60_000,
        }),
      );
      await expect(
        inTx(h.tx, (tx) => h.reservations.updateStatus(tx, reservation.id, "RELEASED", 99)),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards reservation", async () => {
      const id = getIdGenerator().generate();
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.reservations.create(tx, {
            id,
            listingId: getIdGenerator().generate(),
            inventoryItemId: getIdGenerator().generate(),
            buyerId: getIdGenerator().generate(),
            quantity: 1,
            ttlMs: 60_000,
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.reservations.findById(tx, id));
      expect(found).toBeNull();
    });

    it("Idempotency via requestId", async () => {
      const requestId = getIdGenerator().generate();
      const inventoryItemId = getIdGenerator().generate();
      const first = await inTx(h.tx, (tx) =>
        h.reservations.create(tx, {
          listingId: getIdGenerator().generate(),
          inventoryItemId,
          buyerId: getIdGenerator().generate(),
          quantity: 1,
          ttlMs: 60_000,
          requestId,
        }),
      );
      const again = await inTx(h.tx, (tx) =>
        h.reservations.findByRequestId(tx, requestId),
      );
      expect(again?.id).toBe(first.id);
    });

    it("Invalid transition CONFIRMED → HELD fails", async () => {
      const reservation = await inTx(h.tx, (tx) =>
        h.reservations.create(tx, {
          listingId: getIdGenerator().generate(),
          inventoryItemId: getIdGenerator().generate(),
          buyerId: getIdGenerator().generate(),
          quantity: 1,
          ttlMs: 60_000,
        }),
      );
      await inTx(h.tx, (tx) =>
        h.reservations.updateStatus(tx, reservation.id, "CONFIRMED", reservation.rowVersion),
      );
      await expect(
        inTx(h.tx, (tx) => h.reservations.updateStatus(tx, reservation.id, "HELD")),
      ).rejects.toThrow(/reservation_transition_invalid/);
    });

    it("Release frees reservedQuantity", async () => {
      const inventoryItemId = getIdGenerator().generate();
      const reservation = await inTx(h.tx, (tx) =>
        h.reservations.create(tx, {
          listingId: getIdGenerator().generate(),
          inventoryItemId,
          buyerId: getIdGenerator().generate(),
          quantity: 1,
          ttlMs: 60_000,
        }),
      );
      expect(
        await inTx(h.tx, (tx) =>
          h.reservations.reservedQuantityForInventory(tx, inventoryItemId),
        ),
      ).toBe(1);
      await inTx(h.tx, (tx) =>
        h.reservations.updateStatus(tx, reservation.id, "RELEASED", reservation.rowVersion),
      );
      expect(
        await inTx(h.tx, (tx) =>
          h.reservations.reservedQuantityForInventory(tx, inventoryItemId),
        ),
      ).toBe(0);
    });
  });
}
