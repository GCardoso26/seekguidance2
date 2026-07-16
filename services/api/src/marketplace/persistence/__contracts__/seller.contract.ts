import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { MarketplaceContractFactory } from "./types.js";
import { inTx } from "./types.js";

/** SellerRepository contract — Insert/Update/No-op/Concurrency/Rollback/Idempotency. */
export function registerSellerRepositoryContract(factory: MarketplaceContractFactory): void {
  describe("SellerRepository contract", () => {
    let h: Awaited<ReturnType<MarketplaceContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / Update / No-op", async () => {
      const slug = `${h.ns}-seller-ctr`;
      const created = await inTx(h.tx, (tx) =>
        h.sellers.upsert(tx, { displayName: "Loja", slug }),
      );
      expect(created.outcome).toBe("created");
      expect(created.currentVersion).toBe(1);
      expect(created.entity.status).toBe("pending");

      const updated = await inTx(h.tx, (tx) =>
        h.sellers.upsert(tx, { displayName: "Loja", slug, status: "active", expectedVersion: 1 }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.currentVersion).toBe(2);
      expect(updated.entity.status).toBe("active");

      const noop = await inTx(h.tx, (tx) =>
        h.sellers.upsert(tx, { displayName: "Loja", slug, status: "active" }),
      );
      expect(noop.outcome).toBe("unchanged");
      expect(noop.currentVersion).toBe(2);
    });

    it("Concurrency conflict", async () => {
      const slug = `${h.ns}-seller-clk`;
      await inTx(h.tx, (tx) => h.sellers.upsert(tx, { displayName: "L", slug }));
      await expect(
        inTx(h.tx, (tx) =>
          h.sellers.upsert(tx, { displayName: "Bad", slug, expectedVersion: 99 }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards seller", async () => {
      const slug = `${h.ns}-seller-rb`;
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.sellers.upsert(tx, { displayName: "RB", slug });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.sellers.findBySlug(tx, slug));
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const slug = `${h.ns}-seller-idm`;
      const first = await inTx(h.tx, (tx) => h.sellers.upsert(tx, { displayName: "I", slug }));
      const second = await inTx(h.tx, (tx) => h.sellers.upsert(tx, { displayName: "I", slug }));
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
