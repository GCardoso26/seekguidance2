/**
 * AI Assistants — contextual interfaces only (Epic 19). Never a chatbot.
 */

export type AssistantSurface =
  | "collection"
  | "deck"
  | "marketplace"
  | "checkout"
  | "portal"
  | "player";

export type AssistantSuggestion = {
  id: string;
  surface: AssistantSurface;
  message: string;
  href?: string;
  ctaLabel?: string;
  savingsLabel?: string;
};

export interface ContextualAssistant {
  suggest(input: Record<string, unknown>): Promise<AssistantSuggestion[]>;
}

export interface CollectionAssistant extends ContextualAssistant {
  completeSetBudget(input: { gameId?: string; setCode?: string }): Promise<AssistantSuggestion[]>;
}

export interface DeckAssistant extends ContextualAssistant {
  substituteForSavings(input: { deckId: string }): Promise<AssistantSuggestion[]>;
}

export interface MarketplaceListingAssistant extends ContextualAssistant {
  priceVsAverage(input: { listingId?: string; cardId?: string }): Promise<AssistantSuggestion[]>;
}

export interface CheckoutAssistant extends ContextualAssistant {
  multiStoreFreight(input: { cartId?: string }): Promise<AssistantSuggestion[]>;
}

export interface PortalMetaAssistant extends ContextualAssistant {
  risingDeck(input: { gameId?: string }): Promise<AssistantSuggestion[]>;
}

export interface PlayerValueAssistant extends ContextualAssistant {
  collectionDelta(input: { playerId?: string }): Promise<AssistantSuggestion[]>;
}

/** Stub providers — return copy templates; wire to Pricing/Marketplace later without coupling. */
export const stubCollectionAssistant: CollectionAssistant = {
  async suggest() {
    return this.completeSetBudget({});
  },
  async completeSetBudget() {
    return [
      {
        id: "col-set",
        surface: "collection",
        message: "Complete este set gastando R$ XX.",
        href: "/colecao/faltantes",
        ctaLabel: "Ver faltantes",
        savingsLabel: "R$ XX",
      },
    ];
  },
};

export const stubDeckAssistant: DeckAssistant = {
  async suggest(input) {
    return this.substituteForSavings({ deckId: String(input.deckId ?? "") });
  },
  async substituteForSavings({ deckId }) {
    return [
      {
        id: "deck-sub",
        surface: "deck",
        message: "Substitua estas cartas economizando R$ XX.",
        href: deckId ? `/decks/${deckId}?tab=analise` : "/decks",
        ctaLabel: "Ver substituições",
        savingsLabel: "R$ XX",
      },
    ];
  },
};

export const stubMarketplaceListingAssistant: MarketplaceListingAssistant = {
  async suggest() {
    return this.priceVsAverage({});
  },
  async priceVsAverage() {
    return [
      {
        id: "mkt-price",
        surface: "marketplace",
        message: "Seu preço está 18% acima da média.",
        href: "/vendedor/painel/estatisticas/inteligencia",
        ctaLabel: "Ajustar preço",
      },
    ];
  },
};

export const stubCheckoutAssistant: CheckoutAssistant = {
  async suggest() {
    return this.multiStoreFreight({});
  },
  async multiStoreFreight() {
    return [
      {
        id: "chk-freight",
        surface: "checkout",
        message: "Compre destas duas lojas e economize R$ XX em frete.",
        href: "/checkout",
        ctaLabel: "Ver carrinho",
        savingsLabel: "R$ XX",
      },
    ];
  },
};

export const stubPortalMetaAssistant: PortalMetaAssistant = {
  async suggest(input) {
    return this.risingDeck({ gameId: input.gameId as string | undefined });
  },
  async risingDeck({ gameId }) {
    return [
      {
        id: "portal-meta",
        surface: "portal",
        message: "Este deck está crescendo no meta.",
        href: gameId ? `/decks?game=${encodeURIComponent(gameId)}` : "/decks",
        ctaLabel: "Explorar decks",
      },
    ];
  },
};

export const stubPlayerValueAssistant: PlayerValueAssistant = {
  async suggest() {
    return this.collectionDelta({});
  },
  async collectionDelta() {
    return [
      {
        id: "player-value",
        surface: "player",
        message: "Sua coleção valorizou X%.",
        href: "/colecao",
        ctaLabel: "Ver coleção",
      },
    ];
  },
};
