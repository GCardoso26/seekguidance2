import type { GlobalSearchItem } from "@/lib/seller-global-search-mock";
import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

function mapItem(item: GlobalSearchItem): SearchResult {
  const groupMap = {
    order: "orders" as const,
    customer: "customers" as const,
    listing: "cards" as const,
    product: "products" as const,
    coupon: "system" as const,
  };

  const hrefMap: Record<GlobalSearchItem["type"], string> = {
    order: `/vendedor/painel/pedidos?drawer=${encodeURIComponent(item.id)}`,
    customer: `/vendedor/painel/clientes/lista?customer=${encodeURIComponent(item.id)}`,
    listing: `/vendedor/painel/catalogo/cartas?search=${encodeURIComponent(item.title)}`,
    product: `/vendedor/painel/catalogo/produtos?search=${encodeURIComponent(item.title)}`,
    coupon: `/vendedor/painel/marketing/cupons?search=${encodeURIComponent(item.title)}`,
  };

  return {
    id: `${item.type}-${item.id}`,
    group: groupMap[item.type],
    title: item.title,
    subtitle: item.subtitle ?? undefined,
    href: hrefMap[item.type],
    providerId: "seller-global",
    keywords: [item.type, item.status ?? ""].filter(Boolean),
    meta: { status: item.status },
  };
}

export const sellerSearchProvider: SearchProvider = {
  id: "seller-global",
  priority: 80,
  enabled: (ctx) => ctx.surface === "seller" && ctx.isSeller,
  async search(query, _ctx, signal) {
    if (query.length < 2) return [];
    const res = await fetch(`/api/seller/search/global?q=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const categories = data.categories ?? {};
    const items: GlobalSearchItem[] = [
      ...(categories.orders ?? []),
      ...(categories.customers ?? []),
      ...(categories.listings ?? []),
      ...(categories.products ?? []),
      ...(categories.coupons ?? []),
    ];
    return items.map(mapItem);
  },
};
