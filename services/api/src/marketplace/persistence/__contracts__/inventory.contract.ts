import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { MarketplaceContractFactory } from "./types.js";
import { inTx, seedSeller } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

/** InventoryRepository contract — no price; natural key (seller, variant). */
export function registerInventoryRepositoryContract(factory: MarketplaceContractFactory): void {
  describe("InventoryRepository contract", () => {
    let h: Awaited<ReturnType<MarketplaceContractFactory>>;
    let sellerId: string;
    let cardId: string;
    let variantId: string;

    beforeAll(async () => {
      h = await factory();
      sellerId = await seedSeller(h, "inv");
      cardId = getIdGenerator().generate();
      variantId = getIdGenerator().generate();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / Update / No-op", async () => {
      const created = await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: variantId,
          quantity: 3,
        }),
      );
      expect(created.outcome).toBe("created");
      expect(created.entity.quantity).toBe(3);

      const updated = await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: variantId,
          quantity: 7,
          expectedVersion: 1,
        }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.entity.quantity).toBe(7);

      const noop = await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: variantId,
          quantity: 7,
        }),
      );
      expect(noop.outcome).toBe("unchanged");
    });

    it("Concurrency conflict", async () => {
      const vId = getIdGenerator().generate();
      await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: vId,
          quantity: 1,
        }),
      );
      await expect(
        inTx(h.tx, (tx) =>
          h.inventory.upsert(tx, {
            sellerId,
            catalogCardId: cardId,
            catalogVariantId: vId,
            quantity: 2,
            expectedVersion: 99,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards inventory", async () => {
      const vId = getIdGenerator().generate();
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.inventory.upsert(tx, {
            sellerId,
            catalogCardId: cardId,
            catalogVariantId: vId,
            quantity: 5,
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.inventory.findBySellerAndVariant(tx, sellerId, vId));
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const vId = getIdGenerator().generate();
      const first = await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: vId,
          quantity: 2,
        }),
      );
      const second = await inTx(h.tx, (tx) =>
        h.inventory.upsert(tx, {
          sellerId,
          catalogCardId: cardId,
          catalogVariantId: vId,
          quantity: 2,
        }),
      );
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
