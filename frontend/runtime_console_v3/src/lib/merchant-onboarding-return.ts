/** Query `?onboarding=success|refresh` após retorno do Stripe Connect. */
export function isMerchantOnboardingReturn(mode: string | null | undefined): boolean {
  return mode === "success" || mode === "refresh";
}

export async function syncMerchantOnboardingFromStripe(storeId: string | null): Promise<void> {
  if (storeId) {
    await fetch(`/api/marketplace/shop/connect/refresh/${encodeURIComponent(storeId)}`, {
      method: "POST",
    });
    return;
  }
  await fetch("/api/merchant/onboarding/sync", { method: "POST" });
}
