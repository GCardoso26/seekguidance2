"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { isMerchantKycBlocked } from "@/lib/merchant-kyc-guard";
import { isMerchantOnboardingReturn } from "@/lib/merchant-onboarding-return";

/** Redireciona lojistas com KYC bloqueado (pending/rejected/restricted) para /loja/suspensa. */
export function useMerchantKycGuard(enabled = true) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onboardingMode = searchParams.get("onboarding");
  const skipForOnboardingReturn = isMerchantOnboardingReturn(onboardingMode);

  const { data, isLoading } = useAccountStatus();

  const blocked = Boolean(data?.merchant && isMerchantKycBlocked(data.merchant));

  useEffect(() => {
    if (!enabled || isLoading || !blocked || skipForOnboardingReturn) return;
    router.replace("/loja/suspensa");
  }, [blocked, enabled, isLoading, router, skipForOnboardingReturn]);

  return {
    isLoading,
    isBlocked: blocked,
    kycStatus: data?.merchant?.kyc_status,
  };
}
