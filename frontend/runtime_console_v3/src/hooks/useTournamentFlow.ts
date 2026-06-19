"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useTournamentDetail(tournamentId: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => api(`/api/tournament/tournaments/${tournamentId}`),
    enabled: Boolean(tournamentId),
  });
}

export function useStandings(tournamentId: string) {
  return useQuery({
    queryKey: ["standings", tournamentId],
    queryFn: () => api(`/api/tournament/tournaments/${tournamentId}/standings`),
    enabled: Boolean(tournamentId),
    refetchInterval: 15_000,
  });
}

export function useRoundPairings(tournamentId: string, roundNumber: number) {
  return useQuery({
    queryKey: ["pairings", tournamentId, roundNumber],
    queryFn: () => api(`/api/tournament/tournaments/${tournamentId}/rounds/${roundNumber}`),
    enabled: Boolean(tournamentId) && roundNumber > 0,
  });
}

export function useTournamentFlow(tournamentId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    void qc.invalidateQueries({ queryKey: ["standings", tournamentId] });
    void qc.invalidateQueries({ queryKey: ["pairings", tournamentId] });
  };

  const startCheckIn = useMutation({
    mutationFn: () => api(`/api/tournament/tournaments/${tournamentId}/start-check-in`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const startTournament = useMutation({
    mutationFn: () => api(`/api/tournament/tournaments/${tournamentId}/start`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const generateRound = useMutation({
    mutationFn: () => api(`/api/tournament/tournaments/${tournamentId}/rounds`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const startRound = useMutation({
    mutationFn: (roundNumber: number) =>
      api(`/api/tournament/tournaments/${tournamentId}/rounds/${roundNumber}/start`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const extendRound = useMutation({
    mutationFn: ({ roundNumber, minutes }: { roundNumber: number; minutes: number }) =>
      api(`/api/tournament/tournaments/${tournamentId}/rounds/${roundNumber}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      }),
    onSuccess: invalidate,
  });

  const endRound = useMutation({
    mutationFn: (roundNumber: number) =>
      api(`/api/tournament/tournaments/${tournamentId}/rounds/${roundNumber}/end`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const advanceTopCut = useMutation({
    mutationFn: () => api(`/api/tournament/tournaments/${tournamentId}/advance-top-cut`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const finalize = useMutation({
    mutationFn: () => api(`/api/tournament/tournaments/${tournamentId}/finalize`, { method: "POST" }),
    onSuccess: invalidate,
  });

  return {
    startCheckIn,
    startTournament,
    generateRound,
    startRound,
    extendRound,
    endRound,
    advanceTopCut,
    finalize,
  };
}

export function useRegisterTournament(tournamentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (displayName?: string) => {
      const res = await fetch(`/api/tournament/tournaments/${tournamentId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(displayName ? { display_name: displayName } : {}),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? "Falha na inscrição");
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      void qc.invalidateQueries({ queryKey: ["pairings", tournamentId] });
    },
  });
}
