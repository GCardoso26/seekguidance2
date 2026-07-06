import type { IntelligenceDashboard } from "@/types/seller-intelligence";

export function sellerIntelligenceMock(): IntelligenceDashboard {
  return {
    sales: {
      period: "30d",
      summary: {
        orders: 48,
        units_sold: 112,
        revenue_cents: 485_000,
        unique_buyers: 36,
        revenue_trend_pct: 12.4,
      },
      chart: [
        { date: "2026-06-28", orders_count: 3, revenue_cents: 28_000, units_sold: 6 },
        { date: "2026-06-29", orders_count: 5, revenue_cents: 42_000, units_sold: 11 },
        { date: "2026-06-30", orders_count: 2, revenue_cents: 15_000, units_sold: 4 },
      ],
      projection: {},
    },
    top_listings: [
      {
        listing_id: "l1",
        card_name: "Lightning Bolt",
        sales_count: 8,
        revenue_cents: 64_000,
        conversion_rate: 0.08,
        listing_status: "active",
      },
    ],
    pricing_suggestions: [
      {
        listing_id: "l2",
        card_name: "Counterspell",
        listing_price_cents: 4500,
        suggested_price_cents: 3800,
        delta_pct: 18.4,
        suggestion: "lower",
        confidence: 0.72,
      },
    ],
    pricing_opportunities: 3,
    at_risk_buyers: [
      {
        buyer_id: "b1",
        buyer_name: "João M.",
        churn_score: 78,
        risk_level: "high",
        days_since_last_order: 92,
        order_count: 4,
      },
    ],
    at_risk_count: 1,
  };
}
