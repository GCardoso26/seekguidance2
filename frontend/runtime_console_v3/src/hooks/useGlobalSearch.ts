"use client";

import { useQuery } from "@tanstack/react-query";
import type { GlobalSearchResponse } from "@/lib/seller-global-search-mock";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      if (query.length < 2) return null;
      const res = await fetch(`/api/seller/search/global?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("search_failed");
      return res.json() as Promise<GlobalSearchResponse>;
    },
    enabled: query.length >= 2,
    staleTime: 0,
  });
}
