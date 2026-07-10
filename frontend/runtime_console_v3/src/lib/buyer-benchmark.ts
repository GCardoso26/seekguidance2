/**
 * Benchmark competitivo — Buyer Experience (Sprint 14)
 * Nunca copiar identidade visual dos peers.
 */

export type BuyerPeer =
  | "TCGPlayer"
  | "CardTrader"
  | "Cardmarket"
  | "LigaMagic"
  | "MyP Cards"
  | "Mercado Livre"
  | "Amazon";

export type BuyerDimension =
  | "buyer_dashboard"
  | "smart_wishlist"
  | "smart_cart"
  | "marketplace_intelligence"
  | "recommendations"
  | "buyer_ai"
  | "collection_manager"
  | "deck_shopping"
  | "search_everywhere"
  | "reputation_experience"
  | "checkout"
  | "mobile"
  | "accessibility";

export const BUYER_BENCHMARK: Record<
  BuyerDimension,
  { judgetcg: "ahead" | "parity" | "behind"; peers_ahead: BuyerPeer[]; note: string }
> = {
  buyer_dashboard: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Painel unificado com pedidos, wishlist, coleção, savings e Buyer AI.",
  },
  smart_wishlist: {
    judgetcg: "ahead",
    peers_ahead: ["CardTrader"],
    note: "Múltiplas listas + alertas de preço; stock/trusted alerts em evolução.",
  },
  smart_cart: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Otimização por preço/frete/lojas/reputação/prazo com economia estimada.",
  },
  marketplace_intelligence: {
    judgetcg: "parity",
    peers_ahead: ["TCGPlayer", "Cardmarket"],
    note: "Min/avg/max/sugerido + trust médio; volume/velocidade derivados de samples.",
  },
  recommendations: {
    judgetcg: "parity",
    peers_ahead: ["Amazon", "TCGPlayer"],
    note: "You may like / FBT / substitutions via read models de pedidos e listagens.",
  },
  buyer_ai: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Copiloto sugestivo (nunca auto-compra) — diferencial vs peers BR.",
  },
  collection_manager: {
    judgetcg: "parity",
    peers_ahead: ["TCGPlayer"],
    note: "Valor, duplicatas, CSV import; valor por expansão ainda básico.",
  },
  deck_shopping: {
    judgetcg: "ahead",
    peers_ahead: ["CardTrader"],
    note: "Owned/missing + melhor combinação de lojas + add to cart.",
  },
  search_everywhere: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "CTRL+K com wishlist, pedidos, decks, coleção e lojas favoritas.",
  },
  reputation_experience: {
    judgetcg: "ahead",
    peers_ahead: [],
    note: "Trust Score + SLA + badges do Reputation Engine na página da loja.",
  },
  checkout: {
    judgetcg: "parity",
    peers_ahead: ["Mercado Livre", "Amazon"],
    note: "Resumo por loja, frete/economia estimados, PIX/Stripe/escrow.",
  },
  mobile: {
    judgetcg: "parity",
    peers_ahead: ["CardTrader"],
    note: "Bottom nav com Comprar + sticky cart no smart cart.",
  },
  accessibility: {
    judgetcg: "parity",
    peers_ahead: ["Amazon"],
    note: "Skip link, ARIA em tabs/carrinho, contraste luxury — WCAG AA contínuo.",
  },
};

export function buyerBenchmarkScore(): { ahead: number; parity: number; behind: number } {
  const values = Object.values(BUYER_BENCHMARK);
  return {
    ahead: values.filter((v) => v.judgetcg === "ahead").length,
    parity: values.filter((v) => v.judgetcg === "parity").length,
    behind: values.filter((v) => v.judgetcg === "behind").length,
  };
}
