"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GameCode, ParsedDecklist, TournamentFormat, ValidationResult } from "@/lib/tcg-adapters";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useTournamentGames() {
  return useQuery({
    queryKey: ["tournament-games"],
    queryFn: () => fetchJson<typeof TOURNAMENT_GAMES>("/api/tournament/games"),
    staleTime: 60_000,
    placeholderData: TOURNAMENT_GAMES,
  });
}

export function useGameFormats(gameCode: GameCode | null) {
  return useQuery({
    queryKey: ["game-formats", gameCode],
    queryFn: () => fetchJson<TournamentFormat[]>(`/api/tournament/games/${gameCode}/formats`),
    enabled: Boolean(gameCode),
  });
}

export function useCardSearch(gameCode: GameCode | null, query: string) {
  return useQuery({
    queryKey: ["card-search", gameCode, query],
    queryFn: () =>
      fetchJson(`/api/tournament/games/${gameCode}/cards/search?q=${encodeURIComponent(query)}`),
    enabled: Boolean(gameCode) && query.length >= 2,
  });
}

export function useDeckValidate(gameCode: GameCode) {
  return useMutation({
    mutationFn: (body: { format: string; raw?: string; main_deck?: unknown[] }) =>
      fetchJson<ValidationResult>(`/api/tournament/games/${gameCode}/decklist/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useDeckParse(gameCode: GameCode) {
  return useMutation({
    mutationFn: (body: { format: string; raw: string }) =>
      fetchJson<ParsedDecklist>(`/api/tournament/games/${gameCode}/decklist/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchJson("/api/tournament/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useTournaments(game?: string) {
  const qs = game ? `?game=${encodeURIComponent(game)}` : "";
  return useQuery({
    queryKey: ["tournaments", game ?? "all"],
    queryFn: () => fetchJson(`/api/tournament/tournaments${qs}`),
  });
}
