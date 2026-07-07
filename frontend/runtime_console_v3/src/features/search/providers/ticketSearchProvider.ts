import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

export const ticketSearchProvider: SearchProvider = {
  id: "tickets",
  priority: 70,
  enabled: (ctx) => ctx.surface === "seller" && ctx.isSeller,
  async search(query, _ctx, signal) {
    if (query.length < 2) return [];
    const res = await fetch("/api/seller/tickets?status=open", { signal, cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { tickets?: Array<{ id: string; subject: string; status?: string }> };
    const q = query.toLowerCase();
    return (data.tickets ?? [])
      .filter((t) => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      .slice(0, 6)
      .map(
        (t): SearchResult => ({
          id: `ticket-${t.id}`,
          group: "tickets",
          title: t.subject,
          subtitle: t.status,
          href: `/vendedor/painel/atendimento/tickets?ticket=${encodeURIComponent(t.id)}`,
          providerId: "tickets",
        }),
      );
  },
};
