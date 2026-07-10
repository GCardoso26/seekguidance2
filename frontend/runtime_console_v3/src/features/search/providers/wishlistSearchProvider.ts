import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";
import { isFeatureEnabled } from "@/lib/feature-flags";

type WishItem = { product_id: string; product?: { name?: string }; added_at?: string };

async function fetchWishlistItems(signal?: AbortSignal): Promise<WishItem[]> {
  if (isFeatureEnabled("WISHLIST_V2")) {
    const listsRes = await fetch("/api/buyer/wishlists", { signal, cache: "no-store" });
    if (listsRes.ok) {
      const listsData = (await listsRes.json()) as { lists?: Array<{ id: string; is_default?: boolean }> };
      const def = listsData.lists?.find((l) => l.is_default) ?? listsData.lists?.[0];
      if (def?.id) {
        const detailRes = await fetch(`/api/buyer/wishlists/${encodeURIComponent(def.id)}`, {
          signal,
          cache: "no-store",
        });
        if (detailRes.ok) {
          const detail = (await detailRes.json()) as { items?: WishItem[] };
          return detail.items ?? [];
        }
      }
    }
  }
  const res = await fetch("/api/wishlist", { signal, cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: WishItem[] };
  return data.items ?? [];
}

export const wishlistSearchProvider: SearchProvider = {
  id: "wishlist",
  priority: 74,
  enabled: (ctx) => ctx.isAuthenticated,
  async search(query, ctx, signal) {
    if (!ctx.isAuthenticated || query.length < 2) return [];
    const items = await fetchWishlistItems(signal);
    return items
      .filter((i) => matchesFuzzy(query, i.product?.name, i.product_id))
      .slice(0, 6)
      .map(
        (i): SearchResult => ({
          id: `wish-${i.product_id}`,
          group: "products",
          title: i.product?.name ?? i.product_id,
          subtitle: "Wishlist",
          href: `/marketplace/product/${i.product_id}`,
          providerId: "wishlist",
          keywords: ["wishlist", "desejos"],
        }),
      );
  },
};
