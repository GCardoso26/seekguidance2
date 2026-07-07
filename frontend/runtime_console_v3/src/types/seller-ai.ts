export type InsightPriority = "high" | "medium" | "low";
export type InsightCategory =
  | "pricing"
  | "inventory"
  | "orders"
  | "tickets"
  | "reputation"
  | "finance"
  | "analytics";

export type SellerInsight = {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  reason: string;
  impact: string;
  cta_label: string;
  cta_href: string;
  metric_value?: number | null;
  prepared_action_type?: string | null;
};

export type SellerDailyBrief = {
  greeting: string;
  summary: string;
  opportunity_count: number;
  highlights: string[];
  metrics: {
    revenue_today_cents?: number;
    pending_orders?: number;
    open_tickets?: number;
    trust_score?: number;
    chargebacks_open?: number;
  };
  top_insights: SellerInsight[];
  generated_at: string;
};

export type SellerInsightsResponse = {
  insights: SellerInsight[];
  grouped: Record<InsightPriority, SellerInsight[]>;
  total: number;
  store_id: string;
};

export type ActionPlanItem = {
  resource_type: string;
  resource_id: string;
  field: string;
  current_value: unknown;
  proposed_value: unknown;
  label: string;
};

export type ActionPlan = {
  action_type: string;
  title: string;
  description: string;
  items: ActionPlanItem[];
  requires_confirmation: boolean;
  execute_endpoint?: string | null;
  execute_method?: string;
};
