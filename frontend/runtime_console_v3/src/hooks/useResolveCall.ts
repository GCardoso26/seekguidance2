"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RulingCategory } from "@/types/judge-calls";

export type ResolveCallPayload = {
  callId: string;
  ruling: string;
  rulingCategory: RulingCategory;
  infractingPlayerId?: string;
  infractionType?: string;
  severity?: string;
};

export function useResolveCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ResolveCallPayload) => {
      const res = await fetch(`/api/judge/calls/${payload.callId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruling: payload.ruling,
          ruling_category: payload.rulingCategory,
          infracting_player_id: payload.infractingPlayerId,
          infraction_type: payload.infractionType,
          severity: payload.severity,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Falha ao resolver chamada");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judge-calls"] });
    },
  });
}

export function useEscalateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ callId, reason }: { callId: string; reason: string }) => {
      const res = await fetch(`/api/judge/calls/${callId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Falha ao escalar chamada");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judge-calls"] });
    },
  });
}
