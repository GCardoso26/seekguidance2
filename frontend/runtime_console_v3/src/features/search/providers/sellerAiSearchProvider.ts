import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";
import { matchesFuzzy } from "@/features/search/fuzzy/fuzzyMatch";

const AI_QUERIES: Array<{
  keywords: string[];
  title: string;
  subtitle: string;
  href: string;
}> = [
  {
    keywords: ["estoque", "sem estoque", "low stock", "baixo estoque"],
    title: "Produtos sem estoque",
    subtitle: "Insights — estoque baixo",
    href: "/vendedor/painel/insights?focus=inventory",
  },
  {
    keywords: ["atrasado", "atrasados", "late", "sla"],
    title: "Pedidos atrasados",
    subtitle: "Insights — pedidos",
    href: "/vendedor/painel/pedidos?tab=late",
  },
  {
    keywords: ["ticket", "tickets", "pendente", "suporte"],
    title: "Tickets pendentes",
    subtitle: "Insights — atendimento",
    href: "/vendedor/painel/atendimento/tickets?status=open",
  },
  {
    keywords: ["pausado", "pausados", "inactive", "inativo"],
    title: "Produtos pausados",
    subtitle: "Insights — catálogo",
    href: "/vendedor/painel/listagens?status=inactive",
  },
  {
    keywords: ["sem imagem", "imagem", "no image", "foto"],
    title: "Produtos sem imagem",
    subtitle: "Insights — catálogo",
    href: "/vendedor/painel/listagens?filter=no_image",
  },
  {
    keywords: ["receita", "receita hoje", "vendas hoje", "revenue"],
    title: "Receita hoje",
    subtitle: "Insights — financeiro",
    href: "/vendedor/painel/insights",
  },
  {
    keywords: ["chargeback", "chargebacks", "disputa"],
    title: "Chargebacks",
    subtitle: "Insights — financeiro",
    href: "/vendedor/painel/financeiro/chargebacks",
  },
  {
    keywords: ["assistente", "insights", "ia", "ai", "copiloto", "recomendacao"],
    title: "Assistente da Loja",
    subtitle: "Insights e recomendações",
    href: "/vendedor/painel/insights",
  },
];

export const sellerAiSearchProvider: SearchProvider = {
  id: "seller-ai",
  priority: 55,
  enabled: (ctx: SearchContext) => ctx.surface === "seller" && ctx.isSeller,
  async search(query, _ctx, _signal) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];
    for (const item of AI_QUERIES) {
      const hay = `${item.title} ${item.keywords.join(" ")}`.toLowerCase();
      if (matchesFuzzy(q, hay) || item.keywords.some((k) => k.includes(q) || q.includes(k))) {
        results.push({
          id: `ai-${item.href}`,
          group: "system",
          title: item.title,
          subtitle: item.subtitle,
          href: item.href,
          providerId: "seller-ai",
          keywords: item.keywords,
        });
      }
    }
    return results;
  },
};
