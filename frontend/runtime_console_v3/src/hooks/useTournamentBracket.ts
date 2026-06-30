"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BracketResponse, StandingRow } from "@/types/tournament-bracket";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function tournamentBracketKeys(tournamentId: string) {
  return {
    bracket: ["bracket", tournamentId] as const,
    standings: ["standings", tournamentId] as const,
    pairings: (round: number) => ["pairings", tournamentId, round] as const,
    tournament: ["tournament", tournamentId] as const,
  };
}

function normalizeStandings(raw: unknown): StandingRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const r = row as Record<string, unknown>;
    return {
      rank: Number(r.rank ?? index + 1),
      displayName: String(r.display_name ?? r.displayName ?? "—"),
      matchPoints: Number(r.match_points ?? r.matchPoints ?? 0),
      matchWins: Number(r.match_wins ?? r.matchWins ?? 0),
      matchLosses: Number(r.match_losses ?? r.matchLosses ?? 0),
      matchDraws: Number(r.match_draws ?? r.matchDraws ?? 0),
      omwPercent: Number(r.omw_percent ?? r.omwPercent ?? 0),
      gwPercent: Number(r.gw_percent ?? r.gwPercent ?? 0),
      ogwPercent: Number(r.ogw_percent ?? r.ogwPercent ?? 0),
      status: String(r.status ?? "active"),
    };
  });
}

export function useTournamentBracket(tournamentId: string, options?: { active?: boolean }) {
  const qc = useQueryClient();
  const keys = tournamentBracketKeys(tournamentId);
  const refetchMs = options?.active ? 5_000 : false;

  const bracket = useQuery({
    queryKey: keys.bracket,
    queryFn: async () => {
      const res = await fetch(`/api/tournament/tournaments/${tournamentId}/bracket`);
      if (res.status === 404) return null;
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? `Erro ${res.status}`);
      }
      return res.json() as Promise<BracketResponse>;
    },
    enabled: Boolean(tournamentId),
    refetchInterval: refetchMs,
  });

  const standings = useQuery({
    queryKey: keys.standings,
    queryFn: async () => {
      const data = await api<unknown>(`/api/tournament/tournaments/${tournamentId}/standings`);
      return normalizeStandings(data);
    },
    enabled: Boolean(tournamentId),
    refetchInterval: refetchMs,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: keys.tournament });
    void qc.invalidateQueries({ queryKey: keys.bracket });
    void qc.invalidateQueries({ queryKey: keys.standings });
    void qc.invalidateQueries({ queryKey: ["pairings", tournamentId] });
  };

  const startBracket = useMutation({
    mutationFn: async (mode: "tournament" | "top_cut" = "top_cut") =>
      api(`/api/tournament/tournaments/${tournamentId}/bracket/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      }),
    onSuccess: invalidate,
  });

  const reportMatchResult = useMutation({
    mutationFn: async ({ matchId, winnerId }: { matchId: string; winnerId: string }) =>
      api(`/api/tournament/tournaments/${tournamentId}/bracket/matches/${matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winnerId }),
      }),
    onSuccess: invalidate,
  });

  const generateRound = useMutation({
    mutationFn: () =>
      api(`/api/tournament/tournaments/${tournamentId}/rounds`, { method: "POST" }),
    onSuccess: invalidate,
  });

  const finalize = useMutation({
    mutationFn: () =>
      api(`/api/tournament/tournaments/${tournamentId}/finalize`, { method: "POST" }),
    onSuccess: invalidate,
  });

  return {
    bracket,
    standings,
    startBracket,
    reportMatchResult,
    generateRound,
    finalize,
    invalidate,
  };
}

export function useSwissRoundPairings(tournamentId: string, roundNumber: number, enabled = true) {
  return useQuery({
    queryKey: tournamentBracketKeys(tournamentId).pairings(roundNumber),
    queryFn: () => api(`/api/tournament/tournaments/${tournamentId}/rounds/${roundNumber}`),
    enabled: Boolean(tournamentId) && roundNumber > 0 && enabled,
    refetchInterval: enabled ? 5_000 : false,
  });
}
