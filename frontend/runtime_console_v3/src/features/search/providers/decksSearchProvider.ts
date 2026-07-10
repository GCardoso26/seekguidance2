import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";

type Deck = { id: string; name: string; game?: string; format?: string; total_cards?: number };

export const decksSearchProvider: SearchProvider = {
  id: "decks",
  priority: 73,
  enabled: (ctx) => ctx.isAuthenticated || ctx.surface === "marketplace" || ctx.surface === "public",
  async search(query, ctx, signal) {
    if (query.length < 2) return [];
    const endpoints = ctx.isAuthenticated
      ? ["/api/decks", "/api/decks/public?limit=20"]
      : ["/api/decks/public?limit=20"];
    const batches = await Promise.all(
      endpoints.map(async (url) => {
        const res = await fetch(url, { signal, cache: "no-store" });
        if (!res.ok) return [] as Deck[];
        const data = (await res.json()) as { decks?: Deck[] };
        return data.decks ?? [];
      }),
    );
    const seen = new Set<string>();
    const decks: Deck[] = [];
    for (const list of batches) {
      for (const d of list) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        decks.push(d);
      }
    }
    return decks
      .filter((d) => matchesFuzzy(query, d.name, d.game, d.format))
      .slice(0, 8)
      .map(
        (d): SearchResult => ({
          id: `deck-${d.id}`,
          group: "products",
          title: d.name,
          subtitle: [d.game, d.format, d.total_cards != null ? `${d.total_cards} cartas` : ""]
            .filter(Boolean)
            .join(" · "),
          href: `/decks/${d.id}`,
          providerId: "decks",
          keywords: ["deck", "baralho", "commander"],
        }),
      );
  },
};
