import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

export const inventorySearchProvider: SearchProvider = {
  id: "inventory",
  priority: 85,
  enabled: (ctx) => ctx.surface === "seller" && ctx.isSeller,
  async search(query, _ctx: SearchContext, signal) {
    if (query.length < 2) return [];
    const params = new URLSearchParams({
      source: "my_catalog",
      kind: "products",
      q: query,
      limit: "8",
      page: "1",
    });
    const res = await fetch(`/api/seller/inventory/search?${params}`, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{ id: string; title: string; quantity?: number; kind?: string }>;
    };
    const items = data.items ?? [];
    return items.map(
      (item): SearchResult => ({
        id: `inventory-${item.id}`,
        group: item.kind === "cards" ? "cards" : "products",
        title: item.title,
        subtitle: `Estoque: ${item.quantity ?? 0}`,
        href: `/vendedor/painel/estoque?q=${encodeURIComponent(item.title)}`,
        providerId: "inventory",
        keywords: ["estoque", "inventory", item.kind ?? ""],
      }),
    );
  },
};
