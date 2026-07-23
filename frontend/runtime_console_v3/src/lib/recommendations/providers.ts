/**
 * Recommendation Engine — interfaces + providers desacoplados.
 * Consome apenas BFFs públicos. Sem IA embutida (extensível).
 */

export type RecommendationItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  ctaLabel?: string;
  score?: number;
};

export interface RecommendationProvider {
  recommend(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export type RecommendationContext = {
  playerId?: string;
  gameId?: string;
  deckId?: string;
  cardId?: string;
};

export interface CollectionAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export interface DeckAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export interface MarketplaceAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export interface PriceAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export interface TournamentAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

export interface MetaAdvisor {
  advise(ctx: RecommendationContext): Promise<RecommendationItem[]>;
}

async function softJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

/** Collection completion / missing — APIs públicas. */
export const defaultCollectionAdvisor: CollectionAdvisor = {
  async advise() {
    const insights = await softJson<{
      completionPct?: number;
      missingCount?: number;
      totalValue?: number;
      valueChangeToday?: number;
    }>("/api/user/collection/insights", {});

    const items: RecommendationItem[] = [];
    if (insights.completionPct != null) {
      const missing = insights.missingCount ?? 0;
      items.push({
        id: "completion",
        title: `Você está ${Math.round(insights.completionPct)}% da coleção`,
        detail:
          missing > 0
            ? `Faltam ${missing} cartas para avançar no progresso.`
            : "Progresso sincronizado com o catálogo.",
        href: "/colecao/faltantes",
        ctaLabel: missing > 0 ? "Ver faltantes" : "Abrir coleção",
        score: insights.completionPct,
      });
    }
    if (insights.valueChangeToday != null) {
      items.push({
        id: "value-today",
        title:
          insights.valueChangeToday >= 0
            ? "Coleção valorizou hoje"
            : "Coleção desvalorizou hoje",
        detail: `Movimento estimado com Pricing público.`,
        href: "/colecao",
        ctaLabel: "Ver dashboard",
      });
    }
    if (!items.length) {
      items.push({
        id: "collection-start",
        title: "Comece sua coleção",
        detail: "Adicione cartas e acompanhe progresso e valor.",
        href: "/colecao",
        ctaLabel: "Abrir coleção",
      });
    }
    return items;
  },
};

/** Deck ownership / shopping — deck shop BFF. */
export const defaultDeckAdvisor: DeckAdvisor = {
  async advise(ctx) {
    if (!ctx.deckId) {
      return [
        {
          id: "deck-explore",
          title: "Explore decks públicos",
          detail: "Compare listas e complete com a sua coleção.",
          href: "/decks",
          ctaLabel: "Ver decks",
        },
      ];
    }
    const shop = await softJson<{
      owned_pct?: number;
      missing_count?: number;
      items?: unknown[];
    }>(`/api/buyer/decks/${encodeURIComponent(ctx.deckId)}/shop?mode=missing`, {});

    const owned = shop.owned_pct;
    const missing = shop.missing_count ?? (Array.isArray(shop.items) ? shop.items.length : undefined);
    if (owned != null) {
      return [
        {
          id: "deck-owned",
          title: `Você possui ${Math.round(owned)}% do deck`,
          detail:
            missing != null && missing > 0
              ? `Faltam ${missing} cartas — comprar agora no marketplace.`
              : "Lista alinhada à sua coleção.",
          href: `/decks/${ctx.deckId}?tab=marketplace`,
          ctaLabel: missing && missing > 0 ? "Comprar faltantes" : "Ver workspace",
          score: owned,
        },
      ];
    }
    return [
      {
        id: "deck-shop",
        title: "Completar deck no marketplace",
        detail: "Melhor combinação de vendedores via Deck Shopping API.",
        href: `/decks/${ctx.deckId}?tab=marketplace`,
        ctaLabel: "Abrir shopping",
      },
    ];
  },
};

/** Marketplace — buyer recommendations. */
export const defaultMarketplaceAdvisor: MarketplaceAdvisor = {
  async advise() {
    const data = await softJson<{
      you_may_like?: Array<{ id?: string; name?: string; reason?: string; href?: string }>;
      frequently_bought_together?: Array<{ id?: string; name?: string }>;
    }>("/api/buyer/recommendations?limit=6", {});

    const items: RecommendationItem[] = [];
    for (const r of data.you_may_like ?? []) {
      items.push({
        id: r.id || r.name || Math.random().toString(36),
        title: r.name || "Recomendado",
        detail: r.reason || "Para você",
        href: r.href || "/loja/busca",
        ctaLabel: "Ver oferta",
      });
    }
    if (!items.length) {
      items.push({
        id: "mkt-browse",
        title: "Melhor combinação no marketplace",
        detail: "Menor preço, frete e confiança do vendedor — via Buyer API.",
        href: "/loja/busca",
        ctaLabel: "Buscar ofertas",
      });
    }
    return items.slice(0, 6);
  },
};

export const defaultPriceAdvisor: PriceAdvisor = {
  async advise(ctx) {
    if (!ctx.cardId) {
      return [
        {
          id: "price-trends",
          title: "Acompanhe preços em movimento",
          detail: "Top movers e tendências do catálogo.",
          href: "/loja/tendencias",
          ctaLabel: "Ver tendências",
        },
      ];
    }
    const hist = await softJson<{
      points?: Array<{ price?: number }>;
      change_pct?: number;
    }>(
      `/api/catalog/cards/${encodeURIComponent(ctx.cardId)}/price-history?range=7d`,
      {},
    );
    const pct = hist.change_pct;
    return [
      {
        id: "card-price",
        title:
          pct != null
            ? `Preço ${pct >= 0 ? "subiu" : "caiu"} ${Math.abs(pct).toFixed(1)}% (7d)`
            : "Histórico de preço disponível",
        detail: "Vale acompanhar liquidez e ofertas do marketplace.",
        href: `/cards/${encodeURIComponent(ctx.cardId)}`,
        ctaLabel: "Ver carta",
      },
    ];
  },
};

export const defaultTournamentAdvisor: TournamentAdvisor = {
  async advise() {
    const data = await softJson<{ events?: Array<{ id: string; name?: string; title?: string }> }>(
      "/api/tournament-platform/events?limit=4",
      {},
    );
    const events = data.events ?? [];
    if (!events.length) {
      return [
        {
          id: "tour-hub",
          title: "Tournament Hub",
          detail: "Calendário, resultados e decklists.",
          href: "/torneio",
          ctaLabel: "Abrir hub",
        },
      ];
    }
    return events.slice(0, 3).map((e) => ({
      id: e.id,
      title: e.name || e.title || "Evento",
      detail: "Evento público · Tournament Platform API",
      href: `/tournament/${e.id}`,
      ctaLabel: "Ver evento",
    }));
  },
};

export const defaultMetaAdvisor: MetaAdvisor = {
  async advise(ctx) {
    return [
      {
        id: "meta",
        title: "Meta competitiva",
        detail: ctx.cardId
          ? "Esta carta aparece em decks públicos e tendências — refine no Tournament Hub."
          : "Explore decks públicos e movers para ler o meta.",
        href: ctx.cardId
          ? `/cards/${encodeURIComponent(ctx.cardId)}`
          : "/decks",
        ctaLabel: "Explorar",
      },
    ];
  },
};

/** Facade genérica — orquestra advisors sem acoplar UI a um provider. */
export const defaultRecommendationProvider: RecommendationProvider = {
  async recommend(ctx) {
    const [collection, marketplace, tournament] = await Promise.all([
      defaultCollectionAdvisor.advise(ctx),
      defaultMarketplaceAdvisor.advise(ctx),
      defaultTournamentAdvisor.advise(ctx),
    ]);
    return [...collection.slice(0, 2), ...marketplace.slice(0, 2), ...tournament.slice(0, 1)];
  },
};
