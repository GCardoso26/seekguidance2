import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

type NavItem = {
  title: string;
  href: string;
  keywords: string[];
  surfaces: SearchContext["surface"][];
  requiresSeller?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard vendedor", href: "/vendedor/painel", keywords: ["painel", "dashboard", "home"], surfaces: ["seller", "public"], requiresSeller: true },
  { title: "Operação", href: "/vendedor/painel/operacao", keywords: ["operacao", "fila", "sla"], surfaces: ["seller"], requiresSeller: true },
  { title: "Pedidos", href: "/vendedor/painel/pedidos", keywords: ["pedidos", "orders", "envio"], surfaces: ["seller"], requiresSeller: true },
  { title: "Anúncios", href: "/vendedor/painel/listagens", keywords: ["listagens", "anuncios", "erp"], surfaces: ["seller"], requiresSeller: true },
  { title: "Nova listagem", href: "/vendedor/painel/listagens/nova", keywords: ["cadastrar", "nova", "carta"], surfaces: ["seller"], requiresSeller: true },
  { title: "Tickets", href: "/vendedor/painel/atendimento/tickets", keywords: ["ticket", "suporte", "atendimento"], surfaces: ["seller"], requiresSeller: true },
  { title: "Inbox", href: "/vendedor/painel/inbox", keywords: ["inbox", "notificacoes"], surfaces: ["seller"], requiresSeller: true },
  { title: "Estoque", href: "/vendedor/painel/estoque", keywords: ["estoque", "inventory", "csv"], surfaces: ["seller"], requiresSeller: true },
  { title: "Financeiro", href: "/vendedor/painel/financeiro/receitas", keywords: ["financeiro", "receita", "stripe"], surfaces: ["seller"], requiresSeller: true },
  { title: "Configurações", href: "/vendedor/painel/configuracoes", keywords: ["config", "settings"], surfaces: ["seller"], requiresSeller: true },
  { title: "Loja MTG", href: "/loja/mtg", keywords: ["loja", "marketplace", "mtg"], surfaces: ["marketplace", "public"] },
  { title: "Decks", href: "/decks", keywords: ["deck", "deckbuilder"], surfaces: ["marketplace", "public"] },
  { title: "Judge IA", href: "/judge", keywords: ["judge", "regras", "ia"], surfaces: ["judge", "public"] },
  { title: "Regras", href: "/regras", keywords: ["regras", "rules"], surfaces: ["judge", "public"] },
  { title: "Admin", href: "/admin", keywords: ["admin", "moderacao"], surfaces: ["admin"], requiresSeller: false },
  { title: "Documentação", href: "/docs", keywords: ["docs", "ajuda", "documentacao"], surfaces: ["public", "seller", "marketplace", "judge", "admin"] },
];

export const navigationSearchProvider: SearchProvider = {
  id: "navigation",
  priority: 60,
  enabled: () => true,
  async search(query, ctx) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return NAV_ITEMS.filter((item) => {
      if (!item.surfaces.includes(ctx.surface) && ctx.surface !== "public") return false;
      if (item.requiresSeller && !ctx.isSeller && ctx.surface === "seller") return false;
      const hay = `${item.title} ${item.keywords.join(" ")}`.toLowerCase();
      return hay.includes(q) || item.keywords.some((k) => k.startsWith(q) || q.startsWith(k));
    }).map(
      (item): SearchResult => ({
        id: `nav-${item.href}`,
        group: "system",
        title: item.title,
        subtitle: "Navegação",
        href: item.href,
        providerId: "navigation",
        keywords: item.keywords,
      }),
    );
  },
};
