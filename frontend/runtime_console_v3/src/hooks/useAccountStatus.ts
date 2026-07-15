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

/** Conta já com CPF/documento ativo — não pedir documento de novo. */
export function isAccountDocumentActive(status: AccountStatusPayload | undefined): boolean {
  const player = status?.player;
  if (!player) return false;
  return (
    player.account_status === "active" ||
    (player.can_purchase === true && player.cpf_verified === true)
  );
}

/** Precisa coletar/validar CPF (ou reenviar se inválido/pendente). */
export function needsCpfCompletion(status: AccountStatusPayload | undefined): boolean {
  if (!status?.player) return false;
  return !isAccountDocumentActive(status);
}

/** Destino pós-login: pula completar-perfil se o documento já estiver ativo. */
export function resolvePostAuthPath(
  status: AccountStatusPayload | undefined,
  destination: string,
): string {
  if (isAccountDocumentActive(status)) return destination;
  return `/completar-perfil?next=${encodeURIComponent(destination)}`;
}
