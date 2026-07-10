import type { CatalogSearchResponse } from "@/types/card";
import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { gameCardDetailPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";

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

    return (data.cards ?? []).map((card) => {
      const slug =
        GAME_TOKENS[card.game as GameId]?.slug || String(card.game).toLowerCase();
      return {
        id: `card-${card.id}`,
        group: "cards" as const,
        title: card.name,
        subtitle: [card.set?.name, card.number ? `#${card.number}` : "", card.artist]
          .filter(Boolean)
          .join(" · "),
        href:
          ctx.surface === "seller"
            ? `/vendedor/painel/catalogo/cartas?search=${encodeURIComponent(card.name)}`
            : gameCardDetailPath(slug, card.id),
        providerId: "cards",
        keywords: [
          card.set?.name ?? "",
          card.game as string,
          card.number,
          card.artist ?? "",
          card.rarity as string,
        ],
        meta: { image: card.imageUris?.small ?? card.imageUris?.normal },
      };
    });
  },
};
