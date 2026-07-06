export type IntelligenceSalesSummary = {
  orders: number;
  units_sold: number;
  revenue_cents: number;
  unique_buyers: number;
  revenue_trend_pct: number;
};

export type IntelligenceListingRow = {
  listing_id?: string;
  card_name?: string;
  sales_count?: number;
  revenue_cents?: number;
  conversion_rate?: number;
  listing_status?: string;
  price_cents?: number;
};

export type PricingSuggestion = {
  listing_id: string;
  card_name?: string;
  listing_price_cents: number;
  suggested_price_cents: number;
  delta_pct: number;
  suggestion: "lower" | "hold" | "raise";
  confidence: number;
};

export type ChurnBuyer = {
  buyer_id: string;
  buyer_name?: string | null;
  churn_score: number;
  risk_level: string;
  days_since_last_order?: number;
  order_count?: number;
};

export type IntelligenceDashboard = {
  sales: {
    period: string;
    summary: IntelligenceSalesSummary;
    chart: Array<{ date: string; orders_count: number; revenue_cents: number; units_sold: number }>;
    projection: Record<string, unknown>;
  };
  top_listings: IntelligenceListingRow[];
  pricing_suggestions: PricingSuggestion[];
  pricing_opportunities: number;
  at_risk_buyers: ChurnBuyer[];
  at_risk_count: number;
};
