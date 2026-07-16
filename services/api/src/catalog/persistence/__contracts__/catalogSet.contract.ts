import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { ContractFactory } from "./types.js";
import { inTx } from "./types.js";

/**
 * CatalogSetRepository contract — same scenarios as Card.
 */
export function registerCatalogSetRepositoryContract(factory: ContractFactory): void {
  describe("CatalogSetRepository contract", () => {
    let harness: Awaited<ReturnType<ContractFactory>>;

    beforeAll(async () => {
      harness = await factory();
    });

    afterAll(async () => {
      await harness?.teardown?.();
    });

    it("Insert / Update / No-op", async () => {
      const created = await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "CTR",
          name: "Contract Set",
        }),
      );
      expect(created.outcome).toBe("created");
      expect(created.currentVersion).toBe(1);

      const updated = await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "CTR",
          name: "Contract Set Renamed",
          expectedVersion: 1,
        }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.currentVersion).toBe(2);

      const noop = await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "CTR",
          name: "Contract Set Renamed",
        }),
      );
      expect(noop.outcome).toBe("unchanged");
      expect(noop.currentVersion).toBe(2);
    });

    it("Concurrency conflict", async () => {
      await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "CLK",
          name: "Lock Set",
        }),
      );
      await expect(
        inTx(harness.tx, (tx) =>
          harness.sets.upsert(tx, {
            gameId: harness.gameId,
            code: "CLK",
            name: "Lock Set Bad",
            expectedVersion: 42,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards set", async () => {
      const code = `RB${Date.now().toString(36).slice(-4).toUpperCase()}`;
      await expect(
        harness.tx.runInTransaction(async (tx) => {
          await harness.sets.upsert(tx, {
            gameId: harness.gameId,
            code,
            name: "Rollback Set",
          });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");

      const found = await inTx(harness.tx, (tx) =>
        harness.sets.findByGameAndCode(tx, harness.gameId, code),
      );
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const first = await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "IDM",
          name: "Idem Set",
        }),
      );
      const second = await inTx(harness.tx, (tx) =>
        harness.sets.upsert(tx, {
          gameId: harness.gameId,
          code: "IDM",
          name: "Idem Set",
        }),
      );
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
