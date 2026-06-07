"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLeague(leagueId: string) {
  return useQuery({
    queryKey: ["league", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}`);
      if (!res.ok) throw new Error("Liga não encontrada");
      return res.json();
    },
    enabled: Boolean(leagueId),
  });
}

export function useLeagues() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const res = await fetch("/api/leagues");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useCreateLeague() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao criar liga");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leagues"] }),
  });
}
