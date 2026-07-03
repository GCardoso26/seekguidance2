import type { DashboardOverviewResponse } from "@/types/seller-dashboard-overview";

export function dashboardOverviewMock(): DashboardOverviewResponse {
  const now = new Date().toISOString();
  return {
    metrics: {
      pending_payment: 12,
      to_separate: 8,
      shipped_today: 4,
      revenue_today_cents: 382_000,
      revenue_delta_cents: 45_000,
    },
    recent_orders: [
      {
        id: "18552",
        status: "paid",
        total_cents: 35_000,
        created_at: now,
        payment_method: "stripe",
        customer_name: "Ana Paula",
      },
      {
        id: "18553",
        status: "pending",
        total_cents: 20_000,
        created_at: now,
        payment_method: "pix",
        customer_name: "Carlos Lima",
      },
      {
        id: "18554",
        status: "cancelled",
        total_cents: 4_500,
        created_at: now,
        customer_name: "Maria Souza",
      },
      {
        id: "18555",
        status: "shipped",
        total_cents: 12_000,
        created_at: now,
        payment_method: "pix",
        customer_name: "João Silva",
      },
    ],
    low_stock: [
      {
        id: "ls-1",
        title: "Lightning Bolt",
        stock: 1,
        game_name: "mtg",
        item_type: "listing",
      },
      {
        id: "ls-2",
        title: "Sol Ring",
        stock: 2,
        game_name: "mtg",
        item_type: "listing",
      },
    ],
    open_tickets: 3,
    fulfillment_sla: {
      picking_overdue: 2,
      packing_overdue: 1,
      shipping_overdue: 0,
      tracking_delayed: 0,
    },
    generated_at: now,
  };
}
