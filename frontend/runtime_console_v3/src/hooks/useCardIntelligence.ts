"use client";

import { useQuery } from "@tanstack/react-query";
import type { CardIntelligenceResponse } from "@/types/card";

export function useCardIntelligence(cardId: string, enabled = true) {
  return useQuery({
    queryKey: ["catalog-intelligence", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/catalog/cards/${encodeURIComponent(cardId)}/intelligence`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("intelligence_unavailable");
      return (await res.json()) as CardIntelligenceResponse;
    },
    enabled: Boolean(cardId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
