"use client";

import { useQuery } from "@tanstack/react-query";
import type { CardVersionsResponse } from "@/lib/card-versions-query";

export type CardVersionsOptions = {
  foil_only?: boolean;
  in_stock?: boolean;
  sort?: string;
};

export function useCardVersions(cardId: string, options?: CardVersionsOptions) {
  return useQuery({
    queryKey: ["card-versions", cardId, options],
    queryFn: async (): Promise<CardVersionsResponse> => {
      const params = new URLSearchParams();
      if (options?.foil_only) params.set("foil_only", "true");
      if (options?.in_stock) params.set("in_stock", "true");
      if (options?.sort) params.set("sort", options.sort);

      const res = await fetch(`/api/catalog/cards/${encodeURIComponent(cardId)}/versions?${params}`);
      if (!res.ok) throw new Error("versions_fetch_failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
    enabled: Boolean(cardId),
  });
}
