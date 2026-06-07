"use client";

import { useQuery } from "@tanstack/react-query";

export type SearchFilters = {
  q?: string;
  game?: string[];
  city?: string;
  freeOnly?: boolean;
  isOfficial?: boolean;
  page?: number;
};

export function useTournamentSearch(filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  filters.game?.forEach((g) => params.append("game", g));
  if (filters.city) params.set("city", filters.city);
  if (filters.freeOnly) params.set("free_only", "true");
  if (filters.isOfficial) params.set("is_official", "true");
  params.set("page", String(filters.page ?? 1));

  return useQuery({
    queryKey: ["tournament-search", filters],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/search?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Busca indisponível");
      return res.json();
    },
  });
}
