import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";

type CollectionItem = {
  id: string;
  card_id: string;
  quantity: number;
  card?: { name?: string; set_name?: string; game_code?: string };
};

export const collectionSearchProvider: SearchProvider = {
  id: "collection",
  priority: 71,
  enabled: (ctx) => ctx.isAuthenticated,
  async search(query, ctx, signal) {
    if (!ctx.isAuthenticated || query.length < 2) return [];
    const res = await fetch("/api/user/collection", { signal, cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: CollectionItem[] };
    return (data.items ?? [])
      .filter((i) => matchesFuzzy(query, i.card?.name, i.card?.set_name, i.card_id))
      .slice(0, 8)
      .map(
        (i): SearchResult => ({
          id: `collection-${i.id}`,
          group: "cards",
          title: i.card?.name ?? i.card_id,
          subtitle: `Coleção · ${i.quantity}x${i.card?.set_name ? ` · ${i.card.set_name}` : ""}`,
          href: `/loja/cartas/${i.card_id}`,
          providerId: "collection",
          keywords: ["colecao", "collection", "owned"],
        }),
      );
  },
};
