"use client";

import { useQuery } from "@tanstack/react-query";
import type { CollectionInsights } from "@/lib/collection-v2";

export function useCollectionInsights(enabled = true) {
  return useQuery({
    queryKey: ["user-collection-insights"],
    queryFn: async (): Promise<CollectionInsights> => {
      const res = await fetch("/api/user/collection/insights", { cache: "no-store" });
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("insights_failed");
      return res.json() as Promise<CollectionInsights>;
    },
    enabled,
    staleTime: 60_000,
  });
}

export type CollectionMissingResponse = {
  game: string;
  set: string;
  missingCount: number;
  minPrice: number | null;
  avgPrice: number | null;
  sumPrice: number | null;
  currency: string;
  missing: Array<{
    id: string;
    name: string;
    setCode: string;
    unitPrice: number | null;
    currency: string;
    imageUrl: string | null;
  }>;
};

export function useCollectionMissing(game: string | null, set: string | null) {
  return useQuery({
    queryKey: ["user-collection-missing", game, set],
    queryFn: async (): Promise<CollectionMissingResponse> => {
      const params = new URLSearchParams({ game: game!, set: set! });
      const res = await fetch(`/api/user/collection/missing?${params}`, { cache: "no-store" });
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("missing_failed");
      return res.json() as Promise<CollectionMissingResponse>;
    },
    enabled: Boolean(game && set),
    staleTime: 60_000,
  });
}
