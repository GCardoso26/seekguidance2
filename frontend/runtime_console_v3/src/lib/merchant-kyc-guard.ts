/** Lojistas bloqueados no painel até KYC verificado (publicação liberada). */

export const MERCHANT_BLOCKED_KYC_STATUSES = new Set(["pending", "rejected", "restricted"]);

export function isMerchantKycBlocked(
  merchant: { kyc_status: string; can_publish?: boolean } | null | undefined,
): boolean {
  if (!merchant) return false;
  if (merchant.can_publish) return false;
  return MERCHANT_BLOCKED_KYC_STATUSES.has(merchant.kyc_status);
}
