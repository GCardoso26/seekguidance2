"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";

const BLOCKED_STATUSES = new Set(["rejected", "restricted"]);

/** Redireciona lojistas com KYC bloqueado para /loja/suspensa. */
export function useMerchantKycGuard(enabled = true) {
  const router = useRouter();
  const { data, isLoading } = useAccountStatus();

  useEffect(() => {
    if (!enabled || isLoading || !data?.merchant) return;
    const status = data.merchant.kyc_status;
    if (BLOCKED_STATUSES.has(status)) {
      router.replace("/loja/suspensa");
    }
  }, [data, enabled, isLoading, router]);

  const status = data?.merchant?.kyc_status;
  return {
    isLoading,
    isBlocked: Boolean(status && BLOCKED_STATUSES.has(status)),
    kycStatus: status,
  };
}
