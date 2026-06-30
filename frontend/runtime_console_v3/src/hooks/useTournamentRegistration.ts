"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TournamentParticipantsAdminResponse,
  TournamentParticipantsPublicResponse,
  TournamentRegistrationStatusResponse,
} from "@/types/tournament-registration";

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function tournamentRegistrationKeys(tournamentId: string) {
  return {
    status: ["tournament-registration", tournamentId] as const,
    participants: ["tournament-participants", tournamentId] as const,
    adminParticipants: ["tournament-participants-admin", tournamentId] as const,
  };
}

export function useTournamentRegistrationStatus(tournamentId: string, enabled = true) {
  return useQuery({
    queryKey: tournamentRegistrationKeys(tournamentId).status,
    queryFn: () =>
      apiJson<TournamentRegistrationStatusResponse>(
        `/api/tournament/tournaments/${tournamentId}/registration/status`,
      ),
    enabled: Boolean(tournamentId) && enabled,
    refetchInterval: (query) =>
      query.state.data?.status === "pending_payment" ? 10_000 : false,
  });
}

export function useTournamentParticipantsPublic(tournamentId: string) {
  return useQuery({
    queryKey: tournamentRegistrationKeys(tournamentId).participants,
    queryFn: () =>
      apiJson<TournamentParticipantsPublicResponse>(
        `/api/tournament/tournaments/${tournamentId}/participants`,
      ),
    enabled: Boolean(tournamentId),
    refetchInterval: 20_000,
  });
}

export function useTournamentParticipantsAdmin(tournamentId: string, enabled = true) {
  return useQuery({
    queryKey: tournamentRegistrationKeys(tournamentId).adminParticipants,
    queryFn: () =>
      apiJson<TournamentParticipantsAdminResponse>(
        `/api/tournament/tournaments/${tournamentId}/participants?admin=1`,
      ),
    enabled: Boolean(tournamentId) && enabled,
  });
}

export function useTournamentRegistration(tournamentId: string) {
  const qc = useQueryClient();
  const keys = tournamentRegistrationKeys(tournamentId);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: keys.status });
    void qc.invalidateQueries({ queryKey: keys.participants });
    void qc.invalidateQueries({ queryKey: keys.adminParticipants });
    void qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    void qc.invalidateQueries({ queryKey: ["pairings", tournamentId] });
  };

  const register = useMutation({
    mutationFn: async (displayName?: string) =>
      apiJson(`/api/tournament/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(displayName ? { display_name: displayName } : {}),
      }),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: async () =>
      apiJson(`/api/tournament/tournaments/${tournamentId}/registration`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  });

  const adminAction = useMutation({
    mutationFn: async ({
      participantId,
      action,
    }: {
      participantId: string;
      action: "confirm" | "cancel" | "mark_paid";
    }) =>
      apiJson(`/api/tournament/tournaments/${tournamentId}/participants/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: invalidate,
  });

  const notifyParticipants = useMutation({
    mutationFn: async () =>
      apiJson(`/api/tournament/tournaments/${tournamentId}/notify-participants`, {
        method: "POST",
      }),
  });

  return { register, cancel, adminAction, notifyParticipants, invalidate };
}

export function useTournamentPaymentConfirm() {
  return useMutation({
    mutationFn: async (paymentIntentId: string) =>
      apiJson("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      }),
  });
}

export function useTournamentPaymentIntent() {
  return useMutation({
    mutationFn: async (tournamentId: string) =>
      apiJson<{
        clientSecret?: string;
        paymentIntentId?: string;
        status?: string;
        amountCents?: number;
      }>("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId }),
      }),
  });
}
