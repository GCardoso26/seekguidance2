import { describe, expect, it } from "vitest";
import { canAccessRules } from "@/lib/rules-access";

describe("canAccessRules", () => {
  it("nega anônimo", () => {
    expect(canAccessRules({ isAuthenticated: false })).toBe(false);
  });

  it("permite PRO", () => {
    expect(canAccessRules({ isAuthenticated: true, subscriptionTier: "pro" })).toBe(true);
  });

  it("permite juiz certificado", () => {
    expect(
      canAccessRules({ isAuthenticated: true, subscriptionTier: "free", hasActiveCertification: true }),
    ).toBe(true);
  });

  it("permite plano lojista", () => {
    expect(canAccessRules({ isAuthenticated: true, subscriptionTier: "free", storePlan: "lojista" })).toBe(true);
  });
});
