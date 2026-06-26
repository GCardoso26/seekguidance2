"use client";

import { useQuery } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export type AccountStatusPayload = {
  player: {
    account_status: string;
    cpf_last4?: string | null;
    cpf_verified: boolean;
    can_purchase: boolean;
  };
  merchant?: {
    kyc_status: string;
    rejection_reason?: string | null;
    verified_at?: string | null;
    can_publish: boolean;
  } | null;
};

export function useAccountStatus() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/account/status");
      if (!res.ok) throw new Error("status_failed");
      return res.json() as Promise<AccountStatusPayload>;
    },
    enabled: Boolean(user),
  });
}

export function needsCpfCompletion(status: AccountStatusPayload | undefined): boolean {
  return Boolean(status && !status.player.can_purchase);
}
