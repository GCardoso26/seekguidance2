/**
 * Extensão IA — interfaces / pontos de extensão.
 * Providers concretos em `@/lib/recommendations/providers` (sem chatbot).
 */
export type {
  RecommendationItem,
  RecommendationProvider,
  CollectionAdvisor,
  DeckAdvisor,
  MarketplaceAdvisor,
  PriceAdvisor,
  TournamentAdvisor,
  MetaAdvisor,
} from "@/lib/recommendations/providers";

export {
  defaultRecommendationProvider,
  defaultCollectionAdvisor,
  defaultDeckAdvisor,
  defaultMarketplaceAdvisor,
  defaultPriceAdvisor,
  defaultTournamentAdvisor,
  defaultMetaAdvisor,
} from "@/lib/recommendations/providers";

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

/** Slots visíveis no perfil — alimentados pelos advisors públicos. */
export const PROFILE_AI_SLOTS = [
  {
    id: "player-insights",
    label: "Player Insights",
    description: "Resumo inteligente da jornada (RecommendationProvider).",
  },
  {
    id: "deck-recommendations",
    label: "Deck Recommendations",
    description: "Sugestões de decks (DeckAdvisor).",
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
