"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useSellerStore } from "@/hooks/useSellerStore";
import { isMerchantOnboardingReturn, syncMerchantOnboardingFromStripe } from "@/lib/merchant-onboarding-return";

/** Sincroniza KYC com Stripe quando a URL traz `?onboarding=success`. */
export function useMerchantOnboardingSync(clearQuery = true) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("onboarding");
  const onboardingReturn = isMerchantOnboardingReturn(mode);
  const { storeId } = useSellerStore();
  const { refetch } = useAccountStatus();
  const router = useRouter();
  const handled = useRef(false);
  const [syncing, setSyncing] = useState(mode === "success");

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
  const searchParams = useSearchParams();
  const mode = searchParams.get("onboarding");
  return isMerchantOnboardingReturn(mode) ? mode : null;
}
