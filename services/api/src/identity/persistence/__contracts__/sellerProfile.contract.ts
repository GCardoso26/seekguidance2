import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { IdentityContractFactory } from "./types.js";
import { inTx, seedUser } from "./types.js";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";

/** SellerProfileRepository contract — the Identity → Marketplace bridge. */
export function registerSellerProfileRepositoryContract(factory: IdentityContractFactory): void {
  describe("SellerProfileRepository contract", () => {
    let h: Awaited<ReturnType<IdentityContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / Update / No-op (user is natural key)", async () => {
      const userId = await seedUser(h, "prof");
      const sellerId = getIdGenerator().generate();
      const created = await inTx(h.tx, (tx) => h.profiles.upsert(tx, { userId, sellerId }));
      expect(created.outcome).toBe("created");

      const sellerId2 = getIdGenerator().generate();
      const updated = await inTx(h.tx, (tx) =>
        h.profiles.upsert(tx, { userId, sellerId: sellerId2, expectedVersion: 1 }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.entity.sellerId).toBe(sellerId2);

      const noop = await inTx(h.tx, (tx) => h.profiles.upsert(tx, { userId, sellerId: sellerId2 }));
      expect(noop.outcome).toBe("unchanged");

      const byUser = await inTx(h.tx, (tx) => h.profiles.findByUserId(tx, userId));
      expect(byUser?.sellerId).toBe(sellerId2);
    });

    it("Concurrency conflict", async () => {
      const userId = await seedUser(h, "prof-clk");
      await inTx(h.tx, (tx) =>
        h.profiles.upsert(tx, { userId, sellerId: getIdGenerator().generate() }),
      );
      await expect(
        inTx(h.tx, (tx) =>
          h.profiles.upsert(tx, {
            userId,
            sellerId: getIdGenerator().generate(),
            expectedVersion: 99,
          }),
        ),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards profile", async () => {
      const userId = await seedUser(h, "prof-rb");
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.profiles.upsert(tx, { userId, sellerId: getIdGenerator().generate() });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.profiles.findByUserId(tx, userId));
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const userId = await seedUser(h, "prof-idm");
      const sellerId = getIdGenerator().generate();
      const first = await inTx(h.tx, (tx) => h.profiles.upsert(tx, { userId, sellerId }));
      const second = await inTx(h.tx, (tx) => h.profiles.upsert(tx, { userId, sellerId }));
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
