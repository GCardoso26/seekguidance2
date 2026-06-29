import { describe, expect, it } from "vitest";
import { isMerchantOnboardingReturn } from "@/lib/merchant-onboarding-return";

describe("merchant-onboarding-return", () => {
  it("detecta retorno do Stripe", () => {
    expect(isMerchantOnboardingReturn("success")).toBe(true);
    expect(isMerchantOnboardingReturn("refresh")).toBe(true);
  });

  it("ignora outros query params", () => {
    expect(isMerchantOnboardingReturn(null)).toBe(false);
    expect(isMerchantOnboardingReturn("failed")).toBe(false);
  });
});
