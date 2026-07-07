import type { CatalogSearchResponse } from "@/types/card";
import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

export const cardSearchProvider: SearchProvider = {
  id: "cards",
  priority: 90,
  enabled: () => true,
  async search(query, ctx, signal) {
    if (query.length < 2) return [];
    const params = new URLSearchParams({ q: query, limit: "8" });
    const res = await fetch(`/api/catalog/cards/search?${params}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as CatalogSearchResponse;
    const baseHref = ctx.surface === "seller" ? "/vendedor/painel/catalogo/cartas" : "/loja/cartas";

    return (data.cards ?? []).map((card) => ({
      id: `card-${card.id}`,
      group: "cards" as const,
      title: card.name,
      subtitle: card.set?.name,
      href: ctx.surface === "seller"
        ? `${baseHref}?search=${encodeURIComponent(card.name)}`
        : `/loja/cartas/${card.id}`,
      providerId: "cards",
      keywords: [card.set?.name ?? "", card.game as string, card.number],
      meta: { image: card.imageUris?.small ?? card.imageUris?.normal },
    }));
  },
};
