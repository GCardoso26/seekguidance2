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

export class AccountStatusError extends Error {
  status: number;
  retryAfterMs?: number;

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "AccountStatusError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function isAccountStatusPayload(data: unknown): data is AccountStatusPayload {
  if (!data || typeof data !== "object") return false;
  const player = (data as AccountStatusPayload).player;
  return Boolean(player && typeof player === "object" && "can_purchase" in player);
}

function parseRetryAfterMs(res: Response): number | undefined {
  const raw = res.headers.get("Retry-After");
  if (!raw) return undefined;
  const asInt = Number(raw);
  if (Number.isFinite(asInt) && asInt >= 0) {
    return Math.min(Math.max(asInt * 1000, 500), 15_000);
  }
  return undefined;
}

export function useAccountStatus(options?: { refetchInterval?: number }) {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: ["account-status", user?.id],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);
      try {
        const res = await fetch("/api/account/status", {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          throw new AccountStatusError(
            res.status === 429 ? "rate_limited" : "status_failed",
            res.status,
            parseRetryAfterMs(res),
          );
        }
        const data: unknown = await res.json();
        if (!isAccountStatusPayload(data)) throw new Error("status_invalid");
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    enabled: Boolean(user),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error instanceof AccountStatusError && error.status === 401) return false;
      return true;
    },
    retryDelay: (attempt, error) => {
      if (error instanceof AccountStatusError && error.retryAfterMs) {
        return error.retryAfterMs;
      }
      return Math.min(1_000 * 2 ** attempt, 8_000);
    },
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
