import type {
  BuyerDashboard,
  BuyerInsightsResponse,
  BuyerRecommendations,
  DeckShopPlan,
  SmartCartAnalysis,
  StoreReputationPublic,
} from "@/types/buyer-experience";

export function buyerDashboardMock(): BuyerDashboard {
  return {
    buyer_id: "mock-buyer",
    orders: {
      recent: [
        {
          id: "ord-mock-1",
          status: "shipped",
          total_cents: 12990,
          store_name: "Judge Store",
          store_slug: "judge-store",
          created_at: new Date().toISOString(),
          use_escrow: true,
        },
      ],
      in_progress: [
        {
          id: "ord-mock-1",
          status: "shipped",
          total_cents: 12990,
          store_name: "Judge Store",
          store_slug: "judge-store",
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
    },
    cart: { item_count: 2, total_cents: 5590 },
    wishlist: { total: 3, source: "mock" },
    collection: { quantity: 42, unique_cards: 38 },
    alerts: { active: 2, triggered: 1 },
    savings_cents: 1500,
    favorite_stores: [
      {
        id: "store-1",
        name: "Judge Store",
        slug: "judge-store",
        trust_score: 92,
        order_count: 3,
        average_rating: 4.9,
        review_count: 120,
      },
    ],
    recommended: buyerRecommendationsMock().you_may_like,
    recommendation_groups: buyerRecommendationsMock(),
    notifications_hint: "/notifications",
  };
}

export function buyerRecommendationsMock(): BuyerRecommendations {
  const sample = (id: string, name: string, price: number): BuyerRecommendations["you_may_like"][0] => ({
    product_id: id,
    name,
    price_cents: price,
    store_name: "Judge Store",
    store_slug: "judge-store",
    trust_score: 90,
    reason: "mock",
    href: `/marketplace/product/${id}`,
  });
  const list = [
    sample("rec-1", "Sol Ring", 2490),
    sample("rec-2", "Command Tower", 890),
    sample("rec-3", "Sleeves Matte", 3490),
    sample("rec-4", "Booster Box", 45900),
  ];
  return {
    you_may_like: list,
    frequently_bought_together: list.slice(0, 2),
    substitutions: list.slice(1, 3),
    upgrades: [list[3]],
    alternatives: list.slice(0, 2),
    based_on: { signals: ["mock"] },
  };
}

export function buyerInsightsMock(): BuyerInsightsResponse {
  return {
    summary: "Encontrei 3 oportunidades para você. Nenhuma compra será feita automaticamente.",
    insights: [
      {
        type: "price_drop",
        priority: "high",
        title: "Queda de preço monitorada",
        description: "Um item da sua wishlist caiu de preço.",
        cta: { label: "Ver alertas", href: "/wishlist/alerts" },
      },
      {
        type: "trusted_deal",
        priority: "medium",
        title: "Oferta em loja confiável",
        description: "Trust 92 · Sol Ring",
        cta: { label: "Ver oferta", href: "/marketplace/product/rec-1" },
      },
      {
        type: "opportunity",
        priority: "medium",
        title: "Você também pode gostar",
        description: "Sugestões com base no seu histórico.",
        cta: { label: "Abrir recomendações", href: "/comprador" },
      },
    ],
    recommendations: buyerRecommendationsMock(),
    policy: { never_auto_buy: true, suggest_only: true },
  };
}

export function smartCartMock(goal = "best_value"): SmartCartAnalysis {
  return {
    cart_id: "cart-mock",
    goal,
    items: [],
    by_store: [
      {
        store_id: "store-1",
        store_name: "Judge Store",
        store_slug: "judge-store",
        trust_score: 92,
        seller_level: "gold",
        items: [
          {
            product_id: "p1",
            name: "Sleeves Dragon Shield",
            price_cents: 3490,
            quantity: 1,
          },
        ],
        subtotal_cents: 3490,
        estimated_shipping_cents: 1200,
        estimated_sla_days: 2,
      },
    ],
    summary: {
      products_cents: 3490,
      estimated_shipping_cents: 1200,
      estimated_total_cents: 4690,
      store_count: 1,
      avg_trust: 92,
      estimated_sla_days: 2,
      savings_cents: 0,
    },
    strategies: [
      { goal: "best_value", score: 100, label: "Melhor custo-benefício", selected: goal === "best_value" },
      { goal: "lowest_price", score: 90, label: "Menor preço total", selected: goal === "lowest_price" },
      { goal: "fewest_stores", score: 85, label: "Menos lojas (menos fretes)", selected: goal === "fewest_stores" },
    ],
    suggested_goal: "best_value",
    auto_reorder_applied: false,
    hint: "Reorganização é sugestão. Confirme no checkout antes de pagar.",
  };
}

export function storeReputationMock(slug: string): StoreReputationPublic {
  return {
    store: {
      id: "store-1",
      name: slug.replace(/-/g, " "),
      slug,
      average_rating: 4.8,
      review_count: 64,
      plan: "pro",
      description: "Loja verificada (mock).",
    },
    trust_score: 91,
    seller_level: "gold",
    badges: ["fast_shipper", "top_seller"],
    orders_completed: 240,
    avg_shipping_hours: 28,
    chargebacks_open: 0,
    response_time_hours: 4,
    reputation: {
      review_avg: 4.8,
      review_count: 64,
      components: { sales: 90, delivery: 92, quality: 88, compliance: 94 },
      sla_violations: 0,
      calculated_at: new Date().toISOString(),
    },
    history_hint: "Mock Reputation Engine",
  };
}

export function deckShopMock(deckId: string, mode: string): DeckShopPlan {
  return {
    deck_id: deckId,
    deck_name: "Deck mock",
    mode,
    owned: [{ card_id: "c1", name: "Sol Ring", needed: 1, owned: 1, missing: 0 }],
    to_buy: [
      {
        card_id: "c2",
        name: "Command Tower",
        needed: 1,
        owned: 0,
        missing: 1,
        buy_qty: 1,
        product_id: "rec-2",
        unit_price_cents: 890,
        store_name: "Judge Store",
        available: true,
      },
    ],
    estimated_value_cents: 890,
    best_store_combination: [
      {
        store_id: "store-1",
        store_name: "Judge Store",
        store_slug: "judge-store",
        trust_score: 92,
        items: [],
        subtotal_cents: 890,
      },
    ],
    actions: {
      buy_all: { mode: "all", href: `/decks/${deckId}?shop=all` },
      buy_missing: { mode: "missing", href: `/decks/${deckId}?shop=missing` },
    },
    policy: "Sugestão apenas — usuário confirma itens no carrinho.",
  };
}
