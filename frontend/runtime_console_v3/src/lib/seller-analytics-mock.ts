import type { SellerAnalyticsResponse } from "@/lib/seller-analytics-query";

const MOCK_BY_USER: Record<string, SellerAnalyticsResponse> = {
  cardseekers: {
    seller_id: "mock-cardseekers",
    username: "cardseekers",
    store_name: "Card Seekers",
    public_metrics: {
      total_sales: 1247,
      total_listings_active: 342,
      total_listings_sold: 891,
      sell_through_rate: 0.72,
      average_ship_time_hours: 18.5,
      response_time_hours: 2.3,
      member_since: "2024-03-15",
      last_active: "2026-07-01T10:30:00Z",
    },
    rating_summary: {
      average_rating: 4.8,
      total_reviews: 156,
      distribution: { "5": 132, "4": 18, "3": 4, "2": 1, "1": 1 },
    },
    top_games: [
      { game_slug: "mtg", game_name: "Magic: The Gathering", listing_count: 180, sales_count: 520 },
      { game_slug: "pokemon", game_name: "Pokémon TCG", listing_count: 95, sales_count: 310 },
    ],
    recent_activity: { sales_last_30d: 45, new_listings_last_30d: 67, trend: "up" },
    activity_sparkline: Array.from({ length: 14 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, "0")}`,
      sales: 2 + (i % 5),
    })),
    badges: [
      { id: "fast_shipper", name: "Entrega Rápida", description: "95% dos envios em ≤24h", icon: "truck" },
      { id: "top_seller", name: "Top Vendedor", description: "1000+ vendas", icon: "crown" },
      { id: "responsive", name: "Responde Rápido", description: "Resposta em ≤3h", icon: "message-circle" },
      { id: "verified", name: "Verificado", description: "Loja verificada", icon: "badge-check" },
    ],
  },
};

const DEFAULT_MOCK: SellerAnalyticsResponse = {
  seller_id: "mock-default",
  username: "seller",
  store_name: "Loja Demo",
  public_metrics: {
    total_sales: 42,
    total_listings_active: 28,
    total_listings_sold: 14,
    sell_through_rate: 0.33,
    average_ship_time_hours: 36,
    response_time_hours: 6,
    member_since: "2025-01-01",
    last_active: null,
  },
  rating_summary: { average_rating: 4.5, total_reviews: 12, distribution: { "5": 8, "4": 3, "3": 1 } },
  top_games: [{ game_slug: "mtg", game_name: "Magic: The Gathering", listing_count: 20, sales_count: 10 }],
  recent_activity: { sales_last_30d: 5, new_listings_last_30d: 8, trend: "stable" },
  activity_sparkline: [],
  badges: [{ id: "new_seller", name: "Novo Vendedor", description: "Membro recente", icon: "sparkles" }],
};

export function sellerAnalyticsMock(username: string): SellerAnalyticsResponse {
  const key = username.toLowerCase();
  const base = MOCK_BY_USER[key] ?? DEFAULT_MOCK;
  return { ...base, username: key, store_name: base.store_name || key };
}
