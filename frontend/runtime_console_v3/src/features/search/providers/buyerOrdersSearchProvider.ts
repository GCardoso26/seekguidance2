import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";

type OrderRow = {
  id: string;
  status?: string;
  store_name?: string;
  total_cents?: number;
};

export const buyerOrdersSearchProvider: SearchProvider = {
  id: "buyer-orders",
  priority: 72,
  enabled: (ctx) => ctx.isAuthenticated && ctx.surface !== "seller",
  async search(query, ctx, signal) {
    if (!ctx.isAuthenticated || query.length < 2) return [];
    const res = await fetch("/api/marketplace/shop/orders", { signal, cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { orders?: OrderRow[] };
    return (data.orders ?? [])
      .filter((o) => matchesFuzzy(query, o.id, o.store_name, o.status))
      .slice(0, 6)
      .map(
        (o): SearchResult => ({
          id: `buyer-order-${o.id}`,
          group: "orders",
          title: `Pedido #${o.id.slice(0, 8)}`,
          subtitle: [o.store_name, o.status].filter(Boolean).join(" · "),
          href: `/marketplace/orders/${o.id}`,
          providerId: "buyer-orders",
          keywords: ["pedido", "order", "compra"],
        }),
      );
  },
};
