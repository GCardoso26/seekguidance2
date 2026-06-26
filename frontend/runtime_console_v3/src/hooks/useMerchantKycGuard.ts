"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { isMerchantKycBlocked } from "@/lib/merchant-kyc-guard";

/** Redireciona lojistas com KYC bloqueado (pending/rejected/restricted) para /loja/suspensa. */
export function useMerchantKycGuard(enabled = true) {
  const router = useRouter();
  const { data, isLoading } = useAccountStatus();

  const blocked = Boolean(data?.merchant && isMerchantKycBlocked(data.merchant));

  useEffect(() => {
    if (!enabled || isLoading || !blocked) return;
    router.replace("/loja/suspensa");
  }, [blocked, enabled, isLoading, router]);

  return {
    isLoading,
    isBlocked: blocked,
    kycStatus: data?.merchant?.kyc_status,
  };
}
