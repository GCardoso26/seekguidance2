import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";

type FavStore = {
  id: string;
  name: string;
  slug: string;
  trust_score?: number;
};

/** Lojas favoritas derivadas do buyer dashboard (proxy de compras recorrentes). */
export const favoriteStoresSearchProvider: SearchProvider = {
  id: "favorite-stores",
  priority: 70,
  enabled: (ctx) => ctx.isAuthenticated,
  async search(query, ctx, signal) {
    if (!ctx.isAuthenticated || query.length < 2) return [];
    const res = await fetch("/api/buyer/dashboard", { signal, cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { favorite_stores?: FavStore[] };
    return (data.favorite_stores ?? [])
      .filter((s) => matchesFuzzy(query, s.name, s.slug))
      .slice(0, 6)
      .map(
        (s): SearchResult => ({
          id: `fav-store-${s.id}`,
          group: "customers",
          title: s.name,
          subtitle: `Loja favorita${s.trust_score != null ? ` · Trust ${Math.round(s.trust_score)}` : ""}`,
          href: `/marketplace/loja/${s.slug}`,
          providerId: "favorite-stores",
          keywords: ["loja", "store", "favorita"],
        }),
      );
  },
};
