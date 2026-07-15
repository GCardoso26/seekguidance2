"use client";

import { useQuery } from "@tanstack/react-query";
import { normalizeCardListing } from "@/lib/normalize-card-listing";
import type { CardDetailResponse } from "@/types/card";

export function useCardDetail(cardId: string) {
  return useQuery({
    queryKey: ["card", "detail", cardId],
    queryFn: async () => {
      const res = await fetch(`/api/catalog/cards/${encodeURIComponent(cardId)}`);
      if (res.status === 404) throw new Error("not_found");
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as CardDetailResponse;
      return {
        ...data,
        listings: (data.listings ?? []).map((listing) =>
          normalizeCardListing(listing, data.card?.id ?? cardId),
        ),
      } satisfies CardDetailResponse;
    },
    staleTime: 300_000,
    enabled: Boolean(cardId),
  });
}
