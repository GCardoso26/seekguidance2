import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { IdentityContractFactory } from "./types.js";
import { inTx, seedUser } from "./types.js";
import { isSessionActive } from "../../domain/models.js";

/** SessionRepository contract — create / find / revoke / rollback. */
export function registerSessionRepositoryContract(factory: IdentityContractFactory): void {
  describe("SessionRepository contract", () => {
    let h: Awaited<ReturnType<IdentityContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("Create / find / active / revoke", async () => {
      const userId = await seedUser(h, "sess");
      const session = await inTx(h.tx, (tx) => h.sessions.create(tx, { userId, ttlMs: 60_000 }));
      expect(session.revokedAt).toBeNull();
      expect(isSessionActive(session, new Date())).toBe(true);

      const found = await inTx(h.tx, (tx) => h.sessions.findById(tx, session.id));
      expect(found?.userId).toBe(userId);

      await inTx(h.tx, (tx) => h.sessions.revoke(tx, session.id));
      const revoked = await inTx(h.tx, (tx) => h.sessions.findById(tx, session.id));
      expect(revoked?.revokedAt).not.toBeNull();
      expect(isSessionActive(revoked!, new Date())).toBe(false);
    });

    it("expired session is not active", async () => {
      const userId = await seedUser(h, "sess-exp");
      const session = await inTx(h.tx, (tx) => h.sessions.create(tx, { userId, ttlMs: -1_000 }));
      expect(isSessionActive(session, new Date())).toBe(false);
    });

    it("Rollback discards session", async () => {
      const userId = await seedUser(h, "sess-rb");
      let createdId = "";
      await expect(
        h.tx.runInTransaction(async (tx) => {
          const s = await h.sessions.create(tx, { userId, ttlMs: 60_000 });
          createdId = s.id;
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const found = await inTx(h.tx, (tx) => h.sessions.findById(tx, createdId));
      expect(found).toBeNull();
    });
  });
}
