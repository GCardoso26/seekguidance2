"use client";

import { useQuery } from "@tanstack/react-query";
import type { CardDetailResponse } from "@/types/card";

export function useCardDetail(cardId: string) {
  return useQuery({
    queryKey: ["card", "detail", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/catalog/cards/${encodeURIComponent(cardId)}`);
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<CardDetailResponse>;
    },
    staleTime: 300_000,
    enabled: Boolean(cardId),
  });
}
