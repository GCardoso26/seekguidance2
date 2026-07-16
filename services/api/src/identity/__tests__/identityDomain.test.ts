import { describe, expect, it } from "vitest";
import { createInMemoryIdentityStack } from "../createInMemoryIdentityStack.js";
import { permissionsForRoles, rolesGrant } from "../policies/rolePolicy.js";

describe("Sprint 4.1 — Identity Domain", () => {
  it("User is pure identity: register normalizes email, grants buyer, no seller field", async () => {
    const id = createInMemoryIdentityStack();
    const created = await id.registerUser.execute({
      email: "  Joao@Example.COM ",
      displayName: "João",
      password: "s3cret!",
    });
    expect(created.outcome).toBe("created");
    expect(created.entity.email).toBe("joao@example.com");
    expect(created.entity.passwordHash).toBeTruthy();
    expect(created.entity.passwordHash).not.toContain("s3cret");
    expect(created.entity).not.toHaveProperty("sellerId");
    expect(created.entity).not.toHaveProperty("roles");

    expect(await id.authorization.rolesOf(created.entity.id)).toEqual(["buyer"]);
    // Duplicate email is rejected (not an update).
    await expect(
      id.registerUser.execute({ email: "joao@example.com", displayName: "João", password: "x" }),
    ).rejects.toThrow("email_taken");
  });

  it("verifies password hash without storing plaintext", async () => {
    const id = createInMemoryIdentityStack();
    const u = await id.registerUser.execute({
      email: "a@b.com",
      displayName: "A",
      password: "correct-horse",
    });
    expect(await id.hasher.verify("correct-horse", u.entity.passwordHash!)).toBe(true);
    expect(await id.hasher.verify("wrong", u.entity.passwordHash!)).toBe(false);
  });

  it("being a seller is a ROLE via SellerProfile, not identity duplication", async () => {
    const id = createInMemoryIdentityStack();
    const user = await id.registerUser.execute({
      email: "s@b.com",
      displayName: "S",
      password: "pass",
    });

    // No seller permission yet.
    expect(await id.authorization.can(user.entity.id, "listing:write")).toBe(false);

    // Bridge to a Marketplace seller aggregate (sellerId comes from Marketplace).
    const profile = await id.createSellerProfile.execute({
      userId: user.entity.id,
      sellerId: "seller-123",
    });
    expect(profile.entity.userId).toBe(user.entity.id);
    expect(profile.entity.sellerId).toBe("seller-123");
    // Same user, no new identity — now holds buyer + seller.
    const roles = await id.authorization.rolesOf(user.entity.id);
    expect(roles.sort()).toEqual(["buyer", "seller"]);
    expect(await id.authorization.can(user.entity.id, "listing:write")).toBe(true);
    expect(await id.authorization.can(user.entity.id, "inventory:write")).toBe(true);

    const byUser = await id.tx.runInTransaction((t) =>
      id.profiles.findByUserId(t, user.entity.id),
    );
    expect(byUser?.sellerId).toBe("seller-123");
  });

  it("RBAC policy: admin implies all; buyer has none of the write perms", () => {
    expect(rolesGrant(["admin"], "listing:delete")).toBe(true);
    expect(rolesGrant(["admin"], "inventory:write")).toBe(true);
    expect(rolesGrant(["buyer"], "listing:write")).toBe(false);
    expect(permissionsForRoles(["seller"]).has("listing:write")).toBe(true);
    expect(permissionsForRoles(["buyer"]).size).toBe(0);
  });

  it("Session aggregate: active until revoked or expired", async () => {
    const id = createInMemoryIdentityStack();
    const user = await id.registerUser.execute({
      email: "x@y.com",
      displayName: "X",
      password: "pass",
    });
    const session = await id.tx.runInTransaction((t) =>
      id.sessions.create(t, { userId: user.entity.id, ttlMs: 60_000 }),
    );
    expect(session.revokedAt).toBeNull();
    await id.tx.runInTransaction((t) => id.sessions.revoke(t, session.id));
    const revoked = await id.tx.runInTransaction((t) => id.sessions.findById(t, session.id));
    expect(revoked?.revokedAt).not.toBeNull();
  });
});
