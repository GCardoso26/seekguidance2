/**
 * Benchmark competitivo — Catalog Intelligence (Sprint 13)
 * Comparação contínua com peers (não copiar identidade visual).
 */

export type Peer = "TCGPlayer" | "CardTrader" | "LigaMagic" | "MyP Cards" | "Cardmarket" | "Amazon" | "Mercado Livre";

export type Dimension =
  | "card_detail_richness"
  | "price_history"
  | "variants"
  | "judge_content"
  | "buy_ux"
  | "search"
  | "seller_tools"
  | "mobile";

export const CATALOG_BENCHMARK: Record<
  Dimension,
  { judgetcg: "ahead" | "parity" | "behind"; peers_ahead: Peer[]; note: string }
> = {
  card_detail_richness: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Ficha unificada com taxonomia, judge insights e market summary.",
  },
  price_history: {
    judgetcg: "parity",
    peers_ahead: ["TCGPlayer", "Cardmarket"],
    note: "Min/avg/max + ranges; volume vendido ainda limitado aos samples de preço.",
  },
  variants: {
    judgetcg: "parity",
    peers_ahead: ["TCGPlayer"],
    note: "Seletor idioma/foil/finish; promo/borderless derivados de game_data.",
  },
  judge_content: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Judge Insights nativo — diferencial claro vs peers comerciais.",
  },
  buy_ux: {
    judgetcg: "parity",
    peers_ahead: ["LigaMagic", "CardTrader"],
    note: "Melhor oferta + comprar agora; frete SLA por loja ainda em evolução.",
  },
  search: {
    judgetcg: "parity",
    peers_ahead: ["TCGPlayer"],
    note: "Facetas + Command Palette + modos gallery/table/compact.",
  },
  seller_tools: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "CTA Anunciar → wizard com prefill + Seller AI hints.",
  },
  mobile: {
    judgetcg: "parity",
    peers_ahead: ["CardTrader"],
    note: "Sticky buy bar + layout responsivo; gallery polish contínuo.",
  },
};

export function benchmarkScore(): { ahead: number; parity: number; behind: number } {
  const values = Object.values(CATALOG_BENCHMARK);
  return {
    ahead: values.filter((v) => v.judgetcg === "ahead").length,
    parity: values.filter((v) => v.judgetcg === "parity").length,
    behind: values.filter((v) => v.judgetcg === "behind").length,
  };
}
