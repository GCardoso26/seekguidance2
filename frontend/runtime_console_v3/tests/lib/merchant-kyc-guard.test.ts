import { describe, expect, it } from "vitest";
import { isMerchantKycBlocked, MERCHANT_BLOCKED_KYC_STATUSES } from "@/lib/merchant-kyc-guard";

describe("isMerchantKycBlocked", () => {
  it("não bloqueia sem perfil de lojista", () => {
    expect(isMerchantKycBlocked(null)).toBe(false);
    expect(isMerchantKycBlocked(undefined)).toBe(false);
  });

  it("libera lojista verificado", () => {
    expect(isMerchantKycBlocked({ kyc_status: "verified", can_publish: true })).toBe(false);
  });

  it.each([...MERCHANT_BLOCKED_KYC_STATUSES])("bloqueia status %s", (status) => {
    expect(isMerchantKycBlocked({ kyc_status: status, can_publish: false })).toBe(true);
  });
});
