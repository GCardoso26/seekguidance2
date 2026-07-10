export type BuyerOrderSummary = {
  id: string;
  status?: string | null;
  total_cents: number;
  store_name?: string | null;
  store_slug?: string | null;
  created_at?: string;
  use_escrow?: boolean;
};

export type BuyerRecommendedProduct = {
  product_id: string;
  name: string;
  price_cents: number;
  image?: string | null;
  store_name?: string | null;
  store_slug?: string | null;
  trust_score?: number;
  reason?: string;
  href: string;
};

export type BuyerDashboard = {
  buyer_id: string;
  orders: {
    recent: BuyerOrderSummary[];
    in_progress: BuyerOrderSummary[];
    total: number;
  };
  cart: { item_count: number; total_cents: number };
  wishlist: { total: number; source?: string };
  collection: { quantity: number; unique_cards: number };
  alerts: { active: number; triggered: number };
  savings_cents: number;
  favorite_stores: Array<{
    id: string;
    name: string;
    slug: string;
    average_rating?: number;
    review_count?: number;
    order_count?: number;
    trust_score?: number;
  }>;
  recommended: BuyerRecommendedProduct[];
  recommendation_groups?: BuyerRecommendations;
  notifications_hint?: string;
};

export type BuyerRecommendations = {
  you_may_like: BuyerRecommendedProduct[];
  frequently_bought_together: BuyerRecommendedProduct[];
  substitutions: BuyerRecommendedProduct[];
  upgrades: BuyerRecommendedProduct[];
  alternatives: BuyerRecommendedProduct[];
  based_on?: Record<string, unknown>;
};

export type BuyerInsight = {
  type: string;
  priority: "high" | "medium" | "low" | string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
  meta?: Record<string, unknown>;
};

export type BuyerInsightsResponse = {
  summary: string;
  insights: BuyerInsight[];
  recommendations?: BuyerRecommendations;
  policy?: { never_auto_buy: boolean; suggest_only: boolean };
};

export type SmartCartGoal =
  | "lowest_price"
  | "fewest_stores"
  | "highest_reputation"
  | "best_value"
  | "fastest_shipping";

export type SmartCartStoreGroup = {
  store_id: string;
  store_name: string;
  store_slug?: string | null;
  trust_score: number;
  seller_level?: string;
  items: Array<{
    product_id: string;
    name: string;
    price_cents: number;
    quantity: number;
    image?: string | null;
  }>;
  subtotal_cents: number;
  estimated_shipping_cents: number;
  estimated_sla_days: number;
};

export type SmartCartAnalysis = {
  cart_id: string;
  goal: SmartCartGoal | string;
  items: Array<Record<string, unknown>>;
  by_store: SmartCartStoreGroup[];
  summary: {
    products_cents: number;
    estimated_shipping_cents: number;
    estimated_total_cents: number;
    store_count: number;
    avg_trust: number;
    estimated_sla_days: number;
    savings_cents: number;
  };
  strategies: Array<{
    goal: string;
    score: number;
    label: string;
    selected: boolean;
  }>;
  suggested_goal?: string;
  auto_reorder_applied: boolean;
  hint?: string;
};

export type StoreReputationPublic = {
  store: {
    id: string;
    name: string;
    slug: string;
    average_rating: number;
    review_count: number;
    plan?: string | null;
    description?: string | null;
  };
  trust_score: number;
  seller_level: string;
  badges: string[];
  orders_completed: number;
  avg_shipping_hours?: number | null;
  chargebacks_open: number;
  response_time_hours?: number | null;
  reputation: {
    review_avg: number;
    review_count: number;
    components: Record<string, number>;
    sla_violations: number;
    calculated_at?: string | null;
  };
  history_hint?: string;
};

export type DeckShopPlan = {
  deck_id: string;
  deck_name?: string;
  mode: "all" | "missing" | string;
  owned: Array<Record<string, unknown>>;
  to_buy: Array<Record<string, unknown>>;
  estimated_value_cents: number;
  best_store_combination: Array<{
    store_id: string;
    store_name?: string;
    store_slug?: string;
    trust_score: number;
    items: Array<Record<string, unknown>>;
    subtotal_cents: number;
  }>;
  actions?: Record<string, { mode: string; href: string }>;
  policy?: string;
};
