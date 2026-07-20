import { fuzzyScore, normalizeSearchText } from "@/features/search/fuzzy/fuzzyMatch";
import { expandQueryTokens } from "@/features/search/fuzzy/synonyms";
import type { SearchResult } from "@/features/search/types";

type RankOptions = {
  recentIds?: Set<string>;
  favoriteIds?: Set<string>;
  providerBoost?: Record<string, number>;
};

export function rankSearchResults(
  query: string,
  results: SearchResult[],
  options: RankOptions & { game?: string | null } = {},
): SearchResult[] {
  const expansions = expandQueryTokens(query, options.game);
  const { recentIds = new Set(), favoriteIds = new Set(), providerBoost = {} } = options;

  return [...results]
    .map((item) => {
      const hay = [item.title, item.subtitle, ...(item.keywords ?? [])].join(" ");
      let score = Math.max(...expansions.map((e) => fuzzyScore(e, hay)), 0);

      if (favoriteIds.has(item.id)) score += 30;
      if (recentIds.has(item.id)) score += 20;
      score += providerBoost[item.providerId] ?? 0;

      return { ...item, score };
    })
    .filter((item) => (item.score ?? 0) > 0 || normalizeSearchText(query).length < 2)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
