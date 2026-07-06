/** Tipos do overview operacional do painel lojista. */

export type DashboardOverviewMetrics = {
  pending_payment: number;
  to_separate: number;
  shipped_today: number;
  revenue_today_cents: number;
  revenue_delta_cents: number;
};

export type DashboardRecentOrder = {
  id: string;
  status: string;
  total_cents: number;
  created_at?: string;
  payment_method?: string;
  customer_name?: string | null;
};

export type DashboardLowStockItem = {
  id: string;
  title: string;
  stock: number;
  image_url?: string | null;
  game_name?: string | null;
  item_type?: "listing" | "product";
};

export type FulfillmentSlaMetrics = {
  picking_overdue: number;
  packing_overdue: number;
  shipping_overdue: number;
  tracking_delayed: number;
};

export type ReputationOverview = {
  trust_score: number;
  seller_level: string;
  badges: string[];
  alerts_count: number;
};

export type DashboardOverviewResponse = {
  metrics: DashboardOverviewMetrics;
  fulfillment_sla?: FulfillmentSlaMetrics;
  reputation?: ReputationOverview;
  recent_orders: DashboardRecentOrder[];
  low_stock: DashboardLowStockItem[];
  open_tickets: number;
  generated_at: string;
};
