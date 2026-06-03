import { apiFetch } from "@/services/api/client";

export type MonetizationMetrics = {
  window_days: number;
  pricing_page_views: number;
  pricing_cta_clicks: number;
  pricing_start_free: number;
  paywall_hits: number;
  checkout_started: number;
  checkout_completed: number;
  conversion_rate: number;
  cta_rate: number;
  events_by_type: Record<string, number>;
  daily: Array<{ day: string; event: string; count: number }>;
};

export async function getMonetizationMetrics(days = 30): Promise<MonetizationMetrics> {
  return apiFetch<MonetizationMetrics>(`/runtime/judge/analytics/metrics?days=${days}`, {
    publicRoute: true,
  });
}
