"use client";

import { useQuery } from "@tanstack/react-query";
import type { PriceHistoryPoint } from "@/types/card";

export type PriceHistoryRange = "7d" | "30d" | "90d" | "1y" | "all";

interface PriceHistoryParams {
  cardId: string;
  range: PriceHistoryRange;
  condition?: string;
  foil?: boolean;
}

export function usePriceHistory({ cardId, range, condition, foil }: PriceHistoryParams) {
  return useQuery({
    queryKey: ["card", "price-history", cardId, range, condition, foil],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("range", range);
      if (condition) params.set("condition", condition);
      if (foil !== undefined) params.set("foil", String(foil));

      const res = await fetch(
        `/api/catalog/cards/${encodeURIComponent(cardId)}/price-history?${params}`,
      );
      if (!res.ok) throw new Error("price_history_failed");
      return res.json() as Promise<PriceHistoryPoint[]>;
    },
    staleTime: 60_000,
    enabled: Boolean(cardId),
  });
}
