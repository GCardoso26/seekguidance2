import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { ContractFactory } from "./types.js";
import { inTx } from "./types.js";

/**
 * ProviderMappingRepository contract — Insert · Update · No-op · Lock · Rollback · Idempotent.
 */
export function registerProviderMappingRepositoryContract(factory: ContractFactory): void {
  describe("ProviderMappingRepository contract", () => {
    let harness: Awaited<ReturnType<ContractFactory>>;
    let cardId: string;

    beforeAll(async () => {
      harness = await factory();
      const card = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Mapping Parent",
          normalizedName: "mapping parent",
          cardNumber: "M1",
        }),
      );
      cardId = card.entity.id;
    });

    afterAll(async () => {
      await harness?.teardown?.();
    });

    it("Insert / Update / No-op", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-1",
          catalogCardId: cardId,
        }),
      );
      expect(created.outcome).toBe("created");
      expect(created.currentVersion).toBe(1);

      const updated = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-1",
          catalogCardId: cardId,
          metadata: { source: "contract" },
          expectedVersion: 1,
        }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.currentVersion).toBe(2);

      const noop = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-1",
          catalogCardId: cardId,
          metadata: { source: "contract" },
        }),
      );
      expect(noop.outcome).toBe("unchanged");
    });

    it("Concurrency conflict", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-lock",
          catalogCardId: cardId,
        }),
      );
      await expect(
        inTx(harness.tx, (tx) =>
          harness.mappings.upsert(tx, {
            provider: "scryfall",
            providerObjectType: "CARD",
            providerCardId: "sf-map-lock",
            catalogCardId: cardId,
            metadata: { bad: true },
            expectedVersion: 50,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
      expect(created.outcome).toBe("created");
    });

    it("Rollback discards mapping", async () => {
      const providerCardId = `sf-rb-${Date.now()}`;
      await expect(
        harness.tx.runInTransaction(async (tx) => {
          await harness.mappings.upsert(tx, {
            provider: "scryfall",
            providerObjectType: "CARD",
            providerCardId,
            catalogCardId: cardId,
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");

      const found = await inTx(harness.tx, (tx) =>
        harness.mappings.findByProviderObject(tx, "scryfall", "CARD", { providerCardId }),
      );
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const first = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-idem",
          catalogCardId: cardId,
        }),
      );
      const second = await inTx(harness.tx, (tx) =>
        harness.mappings.upsert(tx, {
          provider: "scryfall",
          providerObjectType: "CARD",
          providerCardId: "sf-map-idem",
          catalogCardId: cardId,
        }),
      );
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
