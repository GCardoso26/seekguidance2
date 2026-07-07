import type { SearchContext, SearchResult } from "@/features/search/types";
import type { SearchProvider } from "@/features/search/providers/types";

const RULES_ITEMS = [
  { title: "Consultar regras MTG", href: "/regras", keywords: ["mtg", "magic", "comprehensive"] },
  { title: "Judge IA — tirar dúvida", href: "/judge", keywords: ["judge", "ia", "ruling"] },
  { title: "Regras Pokémon", href: "/regras?game=pokemon", keywords: ["pokemon", "tcg"] },
  { title: "Regras Yu-Gi-Oh!", href: "/regras?game=ygo", keywords: ["ygo", "yu-gi-oh"] },
];

export const rulesSearchProvider: SearchProvider = {
  id: "rules",
  priority: 50,
  enabled: (ctx) => ctx.surface === "judge" || ctx.isJudge || ctx.surface === "public",
  async search(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return RULES_ITEMS.filter((item) => {
      const hay = `${item.title} ${item.keywords.join(" ")}`.toLowerCase();
      return hay.includes(q);
    }).map(
      (item): SearchResult => ({
        id: `rules-${item.href}`,
        group: "system",
        title: item.title,
        subtitle: "Regras",
        href: item.href,
        providerId: "rules",
        keywords: item.keywords,
      }),
    );
  },
};

export const judgeSearchProvider: SearchProvider = {
  id: "judge",
  priority: 55,
  enabled: (ctx) => ctx.isJudge || ctx.surface === "judge",
  async search(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items = [
      { title: "Assistente Judge", href: "/judge", keywords: ["judge", "perguntar"] },
      { title: "Histórico de consultas", href: "/judge/historico", keywords: ["historico", "threads"] },
    ];
    return items
      .filter((i) => `${i.title} ${i.keywords.join(" ")}`.toLowerCase().includes(q))
      .map(
        (item): SearchResult => ({
          id: `judge-${item.href}`,
          group: "system",
          title: item.title,
          subtitle: "Juiz",
          href: item.href,
          providerId: "judge",
        }),
      );
  },
};
