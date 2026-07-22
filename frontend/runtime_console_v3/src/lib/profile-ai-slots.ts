/**
 * Extensão IA — somente interfaces / pontos de extensão.
 * Sem implementação. Futuro: APIs públicas apenas.
 */

export type PlayerInsight = {
  id: string;
  title: string;
  summary: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export type DeckRecommendation = {
  deckId?: string;
  title: string;
  reason: string;
  href?: string;
};

export type CollectionAdvice = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

export type MarketplaceAdvice = {
  id: string;
  title: string;
  detail: string;
  href?: string;
};

export interface PlayerInsightsProvider {
  getInsights(_playerId: string): Promise<PlayerInsight[]>;
}

export interface DeckRecommendationProvider {
  recommend(_playerId: string): Promise<DeckRecommendation[]>;
}

export interface CollectionAdvisor {
  advise(_playerId: string): Promise<CollectionAdvice[]>;
}

export interface MarketplaceAdvisor {
  advise(_playerId: string): Promise<MarketplaceAdvice[]>;
}

/** Slots visíveis no perfil — UI scaffold, providers não implementados. */
export const PROFILE_AI_SLOTS = [
  {
    id: "player-insights",
    label: "Player Insights",
    description: "Resumo inteligente da jornada (PlayerInsightsProvider).",
  },
  {
    id: "deck-recommendations",
    label: "Deck Recommendations",
    description: "Sugestões de decks (DeckRecommendationProvider).",
  },
  {
    id: "collection-advisor",
    label: "Collection Advisor",
    description: "Orientação de coleção (CollectionAdvisor).",
  },
  {
    id: "marketplace-advisor",
    label: "Marketplace Advisor",
    description: "Oportunidades de compra/venda (MarketplaceAdvisor).",
  },
] as const;

export type ProfileAiSlotId = (typeof PROFILE_AI_SLOTS)[number]["id"];
