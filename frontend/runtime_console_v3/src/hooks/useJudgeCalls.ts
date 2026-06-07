"use client";

import { useQuery } from "@tanstack/react-query";
import { mapJudgeCall, type JudgeCall } from "@/types/judge-calls";

export type JudgeCallsFilters = {
  tournamentId?: string;
  status?: string;
  assignedToMe?: boolean;
  openCalls?: boolean;
};

export function useJudgeCalls(filters: JudgeCallsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tournamentId) params.set("tournament_id", filters.tournamentId);
  if (filters.status) params.set("status", filters.status);
  if (filters.assignedToMe) params.set("assigned_to_me", "true");
  if (filters.openCalls) params.set("open_calls", "true");

  return useQuery({
    queryKey: ["judge-calls", filters],
    queryFn: async () => {
      const res = await fetch(`/api/judge/calls?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar chamadas");
      const data = (await res.json()) as Record<string, unknown>[];
      return data.map(mapJudgeCall) as JudgeCall[];
    },
    refetchInterval: 8_000,
  });
}
