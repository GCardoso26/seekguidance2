"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import type { SyntaxValueOption } from "@/lib/syntax-values-static";

export function useSyntaxAutocomplete(
  field: string | null,
  game: string,
  query: string,
  enabled: boolean,
) {
  const debouncedQuery = useDebounce(query, 150);

  return useQuery({
    queryKey: ["syntax-values", field, game, debouncedQuery],
    queryFn: async (): Promise<SyntaxValueOption[]> => {
      if (!field) return [];
      const params = new URLSearchParams({
        field,
        game,
        q: debouncedQuery,
        limit: "10",
      });
      const res = await fetch(`/api/marketplace/search/syntax-values?${params}`);
      if (!res.ok) throw new Error("syntax_values_failed");
      const data = await res.json();
      return data.values ?? [];
    },
    enabled: enabled && Boolean(field) && process.env.NEXT_PUBLIC_FEATURE_SYNTAX_SEARCH !== "false",
    staleTime: 60 * 60_000,
  });
}
