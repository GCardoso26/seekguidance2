import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { IdentityContractFactory } from "./types.js";
import { inTx } from "./types.js";

/** UserRepository contract — Insert/Update/No-op/Concurrency/Rollback/Idempotency. */
export function registerUserRepositoryContract(factory: IdentityContractFactory): void {
  describe("UserRepository contract", () => {
    let h: Awaited<ReturnType<IdentityContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Insert / Update / No-op (email is natural key, normalized)", async () => {
      const email = `${h.ns}-ctr@example.com`;
      const created = await inTx(h.tx, (tx) =>
        h.users.upsert(tx, { email: email.toUpperCase(), displayName: "Ctr" }),
      );
      expect(created.outcome).toBe("created");
      expect(created.entity.email).toBe(email);

      const updated = await inTx(h.tx, (tx) =>
        h.users.upsert(tx, { email, displayName: "Ctr Renamed", expectedVersion: 1 }),
      );
      expect(updated.outcome).toBe("updated");
      expect(updated.currentVersion).toBe(2);

      const noop = await inTx(h.tx, (tx) =>
        h.users.upsert(tx, { email, displayName: "Ctr Renamed" }),
      );
      expect(noop.outcome).toBe("unchanged");
    });

    it("Concurrency conflict", async () => {
      const email = `${h.ns}-clk@example.com`;
      await inTx(h.tx, (tx) => h.users.upsert(tx, { email, displayName: "A" }));
      await expect(
        inTx(h.tx, (tx) => h.users.upsert(tx, { email, displayName: "B", expectedVersion: 99 })),
      ).rejects.toThrow(/optimistic_lock_failed/);
    });

    it("Rollback discards user", async () => {
      const email = `${h.ns}-rb@example.com`;
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.users.upsert(tx, { email, displayName: "RB" });
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.users.findByEmail(tx, email));
      expect(found).toBeNull();
    });

    it("Idempotent retry", async () => {
      const email = `${h.ns}-idm@example.com`;
      const first = await inTx(h.tx, (tx) => h.users.upsert(tx, { email, displayName: "I" }));
      const second = await inTx(h.tx, (tx) => h.users.upsert(tx, { email, displayName: "I" }));
      expect(first.outcome).toBe("created");
      expect(second.outcome).toBe("unchanged");
    });
  });
}
