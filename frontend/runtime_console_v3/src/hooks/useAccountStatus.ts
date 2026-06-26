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
    onboarding_url?: string | null;
    onboarding_expires_at?: string | null;
  } | null;
};

function isAccountStatusPayload(data: unknown): data is AccountStatusPayload {
  if (!data || typeof data !== "object") return false;
  const player = (data as AccountStatusPayload).player;
  return Boolean(player && typeof player === "object" && "can_purchase" in player);
}

export function useAccountStatus(options?: { refetchInterval?: number }) {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/account/status");
      if (!res.ok) throw new Error("status_failed");
      const data: unknown = await res.json();
      if (!isAccountStatusPayload(data)) throw new Error("status_invalid");
      return data;
    },
    enabled: Boolean(user),
    refetchInterval: options?.refetchInterval,
  });
}

export function needsCpfCompletion(status: AccountStatusPayload | undefined): boolean {
  return Boolean(status?.player && !status.player.can_purchase);
}
