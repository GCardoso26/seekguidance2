import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { ContractFactory } from "./types.js";
import { inTx } from "./types.js";

/**
 * CatalogCardRepository contract — every adapter (InMemory, Postgres, …) must pass.
 *
 * Scenarios (FOUNDATION_FREEZE §14):
 * Insert · Update · No-op · Concurrency conflict · Rollback · Idempotent retry
 */
export function registerCatalogCardRepositoryContract(factory: ContractFactory): void {
  describe("CatalogCardRepository contract", () => {
    let harness: Awaited<ReturnType<ContractFactory>>;

    beforeAll(async () => {
      harness = await factory();
    });

    afterAll(async () => {
      await harness?.teardown?.();
    });

    it("Insert: creates card with row_version=1 and outcome=created", async () => {
      const result = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Contract Bolt",
          normalizedName: "contract bolt",
          cardNumber: "1",
        }),
      );
      expect(result.outcome).toBe("created");
      expect(result.previousVersion).toBeNull();
      expect(result.currentVersion).toBe(1);
      expect(result.entity.rowVersion).toBe(1);
      expect(result.entity.name).toBe("Contract Bolt");
    });

    it("Update: changes fields and increments row_version", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Contract Update Me",
          normalizedName: "contract update me",
          cardNumber: "2",
        }),
      );

      const updated = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          id: created.entity.id,
          gameId: harness.gameId,
          name: "Contract Updated",
          normalizedName: "contract updated",
          cardNumber: "2",
          expectedVersion: created.entity.rowVersion,
        }),
      );

      expect(updated.outcome).toBe("updated");
      expect(updated.previousVersion).toBe(1);
      expect(updated.currentVersion).toBe(2);
      expect(updated.entity.name).toBe("Contract Updated");
    });

    it("No-op: identical upsert returns unchanged without bumping version", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Contract Noop",
          normalizedName: "contract noop",
          cardNumber: "3",
        }),
      );

      const again = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          id: created.entity.id,
          gameId: harness.gameId,
          name: "Contract Noop",
          normalizedName: "contract noop",
          cardNumber: "3",
        }),
      );

      expect(again.outcome).toBe("unchanged");
      expect(again.currentVersion).toBe(created.entity.rowVersion);
      expect(again.entity.rowVersion).toBe(created.entity.rowVersion);
    });

    it("Concurrency conflict: wrong expectedVersion throws", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, {
          gameId: harness.gameId,
          name: "Contract Lock",
          normalizedName: "contract lock",
          cardNumber: "4",
        }),
      );

      await expect(
        inTx(harness.tx, (tx) =>
          harness.cards.upsert(tx, {
            id: created.entity.id,
            gameId: harness.gameId,
            name: "Contract Lock Changed",
            normalizedName: "contract lock changed",
            cardNumber: "4",
            expectedVersion: 999,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback: failed TX discards insert", async () => {
      const marker = `rollback-${Date.now()}`;
      await expect(
        harness.tx.runInTransaction(async (tx) => {
          await harness.cards.upsert(tx, {
            gameId: harness.gameId,
            name: marker,
            normalizedName: marker,
            cardNumber: "5",
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");

      const found = await inTx(harness.tx, (tx) =>
        harness.cards.findByGameAndNormalizedName(tx, harness.gameId, marker),
      );
      expect(found).toHaveLength(0);
    });

    it("Idempotent retry: second identical write stays unchanged", async () => {
      const input = {
        gameId: harness.gameId,
        name: "Contract Idempotent",
        normalizedName: "contract idempotent",
        cardNumber: "6",
      };
      const first = await inTx(harness.tx, (tx) => harness.cards.upsert(tx, input));
      const second = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, { ...input, id: first.entity.id }),
      );
      const third = await inTx(harness.tx, (tx) =>
        harness.cards.upsert(tx, { ...input, id: first.entity.id }),
      );

      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
      expect(third.outcome).toBe("unchanged");
      expect(third.entity.rowVersion).toBe(1);
    });
  });
}
