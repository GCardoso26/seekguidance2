import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { IdentityContractFactory } from "./types.js";
import { inTx, seedUser } from "./types.js";

/** RoleAssignmentRepository contract — idempotent assign / revoke / list. */
export function registerRoleAssignmentRepositoryContract(factory: IdentityContractFactory): void {
  describe("RoleAssignmentRepository contract", () => {
    let h: Awaited<ReturnType<IdentityContractFactory>>;
    beforeAll(async () => {
      h = await factory();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("assign is idempotent; list reflects roles", async () => {
      const userId = await seedUser(h, "role");
      await inTx(h.tx, (tx) => h.roles.assign(tx, userId, "buyer"));
      await inTx(h.tx, (tx) => h.roles.assign(tx, userId, "buyer")); // idempotent
      await inTx(h.tx, (tx) => h.roles.assign(tx, userId, "seller"));
      const roles = await inTx(h.tx, (tx) => h.roles.listRoles(tx, userId));
      expect(roles.sort()).toEqual(["buyer", "seller"]);
    });

    it("revoke removes a role", async () => {
      const userId = await seedUser(h, "role-rev");
      await inTx(h.tx, (tx) => h.roles.assign(tx, userId, "seller"));
      await inTx(h.tx, (tx) => h.roles.revoke(tx, userId, "seller"));
      const roles = await inTx(h.tx, (tx) => h.roles.listRoles(tx, userId));
      expect(roles).not.toContain("seller");
    });

    it("Rollback discards assignment", async () => {
      const userId = await seedUser(h, "role-rb");
      await expect(
        h.tx.runInTransaction(async (tx) => {
          await h.roles.assign(tx, userId, "admin");
          throw new Error("force_rollback");
        }),
      ).rejects.toThrow("force_rollback");
      const roles = await inTx(h.tx, (tx) => h.roles.listRoles(tx, userId));
      expect(roles).not.toContain("admin");
    });
  });
}
