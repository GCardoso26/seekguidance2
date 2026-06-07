"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAcceptCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (callId: string) => {
      const res = await fetch(`/api/judge/calls/${callId}/accept`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Falha ao aceitar chamada");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["judge-calls"] });
    },
  });
}
