import { describe, expect, it } from "vitest";
import { canAccessSeller, requireAuth, requireRole } from "@/src/auth/guards";
import type { CurrentUser } from "@/src/types/auth";

const buyer: CurrentUser = {
  userId: "u1",
  roles: ["buyer"],
  sessionId: "s1",
};

const seller: CurrentUser = {
  userId: "u2",
  roles: ["buyer", "seller"],
  sessionId: "s2",
};

describe("guards", () => {
  it("anonymous bloqueado", () => {
    expect(requireAuth("anonymous", null).ok).toBe(false);
    expect(requireAuth("loading", null).ok).toBe(false);
    expect(requireAuth("authenticated", null).ok).toBe(false);
  });

  it("seller acessa seller route", () => {
    expect(requireRole("authenticated", seller, "seller").ok).toBe(true);
    expect(canAccessSeller(seller)).toBe(true);
  });

  it("buyer recebe UX correta (missing_role)", () => {
    const result = requireRole("authenticated", buyer, "seller");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_role");
      expect(result.redirectTo).toBe("/session");
    }
    expect(canAccessSeller(buyer)).toBe(false);
  });
});
