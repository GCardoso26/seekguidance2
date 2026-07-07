"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ActionPlan, SellerInsightsResponse } from "@/types/seller-ai";

export function useSellerAiInsights(enabled = true) {
  return useQuery({
    queryKey: ["seller-ai-insights"],
    queryFn: async () => {
      const res = await fetch("/api/seller/ai/insights", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar insights");
      return (await res.json()) as SellerInsightsResponse;
    },
    enabled,
    staleTime: 3 * 60 * 1000,
  });
}

export function usePrepareSellerAction() {
  return useMutation({
    mutationFn: async (body: { action_type: string; insight_id?: string; payload?: Record<string, unknown> }) => {
      const res = await fetch("/api/seller/ai/actions/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao preparar ação");
      return (await res.json()) as ActionPlan;
    },
  });
}
