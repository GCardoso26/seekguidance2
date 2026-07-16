import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { ContractFactory } from "./types.js";
import { inTx } from "./types.js";

/**
 * CatalogVariantRepository contract — Insert · Update · No-op · Lock · Rollback · Idempotent.
 */
export function registerCatalogVariantRepositoryContract(factory: ContractFactory): void {
  describe("CatalogVariantRepository contract", () => {
    let harness: Awaited<ReturnType<ContractFactory>>;
    let cardId: string;

    beforeAll(async () => {
      harness = await factory();
      const card = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Variant Parent",
          normalizedName: "variant parent",
          cardNumber: "V1",
        }),
      );
      cardId = card.entity.id;
    });

    afterAll(async () => {
      await harness?.teardown?.();
    });

    it("Insert / Update / No-op", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          cardId,
          finish: "nonfoil",
          isFoil: false,
          label: "Normal",
        }),
      );
      expect(created.outcome).toBe("created");
      expect(created.currentVersion).toBe(1);

      const updated = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          id: created.entity.id,
          cardId,
          finish: "foil",
          isFoil: true,
          label: "Foil",
          expectedVersion: 1,
        }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.currentVersion).toBe(2);

      const noop = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          id: created.entity.id,
          cardId,
          finish: "foil",
          isFoil: true,
          label: "Foil",
        }),
      );
      expect(noop.outcome).toBe("unchanged");
    });

    it("Concurrency conflict", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          cardId,
          finish: "etched",
          isFoil: true,
          label: "Etched",
        }),
      );
      await expect(
        inTx(harness.tx, (tx) =>
          harness.variants.upsert(tx, {
            id: created.entity.id,
            cardId,
            finish: "etched",
            isFoil: true,
            label: "Etched Bad",
            expectedVersion: 99,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards variant", async () => {
      const marker = `rb-var-${Date.now()}`;
      await expect(
        harness.tx.runInTransaction(async (tx) => {
          await harness.variants.upsert(tx, {
            cardId,
            finish: marker,
            label: marker,
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");

      const list = await inTx(harness.tx, (tx) => harness.variants.findByCardId(tx, cardId));
      expect(list.every((v) => v.finish !== marker)).toBe(true);
    });

    it("Idempotent retry", async () => {
      const first = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          cardId,
          finish: "idem",
          label: "Idem",
        }),
      );
      const second = await inTx(harness.tx, (tx) =>
        harness.variants.upsert(tx, {
          id: first.entity.id,
          cardId,
          finish: "idem",
          label: "Idem",
        }),
      );
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
