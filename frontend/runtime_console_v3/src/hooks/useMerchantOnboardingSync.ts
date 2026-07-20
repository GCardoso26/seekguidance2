"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useOnboardingQueryParam } from "@/hooks/useOnboardingQueryParam";
import { useSellerStore } from "@/hooks/useSellerStore";
import { isMerchantOnboardingReturn, syncMerchantOnboardingFromStripe } from "@/lib/merchant-onboarding-return";

/** Sincroniza KYC com Stripe quando a URL traz `?onboarding=success`. */
export function useMerchantOnboardingSync(clearQuery = true) {
  const mode = useOnboardingQueryParam();
  const onboardingReturn = isMerchantOnboardingReturn(mode);
  const { storeId } = useSellerStore();
  const { refetch } = useAccountStatus();
  const router = useRouter();
  const handled = useRef(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (mode !== "success" || handled.current) return;
    handled.current = true;
    setSyncing(true);
    void (async () => {
      try {
        await syncMerchantOnboardingFromStripe(storeId);
        await refetch();
      } finally {
        setSyncing(false);
        if (clearQuery) {
          const path = window.location.pathname;
          router.replace(path);
        }
      }
    })();
  }, [clearQuery, mode, refetch, router, storeId]);

  return { syncing, onboardingReturn };
}

export function useOnboardingReturnMode(): string | null {
  const mode = useOnboardingQueryParam();
  return isMerchantOnboardingReturn(mode) ? mode : null;
}
