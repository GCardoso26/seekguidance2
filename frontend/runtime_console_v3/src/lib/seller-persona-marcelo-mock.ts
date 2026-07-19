import type { DashboardOverviewResponse } from "@/types/seller-dashboard-overview";
import {
  PERSONA_AVG_TICKET_CENTS,
  PERSONA_MONTH_REVENUE_CENTS,
  PERSONA_ORDERS,
  PERSONA_STORE_ID,
  PERSONA_STORE_NAME,
  PERSONA_STORE_SLUG,
} from "@/lib/e2e-persona-marcelo";

/** Overview mock alinhado à persona Marcelo TCG (KPIs de teste). */
export function marceloPersonaDashboardOverviewMock(): DashboardOverviewResponse {
  const now = new Date().toISOString();
  return {
    metrics: {
      pending_payment: PERSONA_ORDERS.pending,
      to_separate: PERSONA_ORDERS.processing,
      shipped_today: Math.min(PERSONA_ORDERS.shipped, 8),
      revenue_today_cents: Math.round(PERSONA_MONTH_REVENUE_CENTS / 30),
      revenue_delta_cents: PERSONA_AVG_TICKET_CENTS * 3,
    },
    recent_orders: [
      {
        id: "persona-ord-paid",
        status: "paid",
        total_cents: PERSONA_AVG_TICKET_CENTS,
        created_at: now,
        payment_method: "pix",
        customer_name: "Ana Paula",
      },
      {
        id: "persona-ord-pending",
        status: "pending",
        total_cents: 20_000,
        created_at: now,
        payment_method: "pix",
        customer_name: "Carlos Lima",
      },
      {
        id: "persona-ord-shipped",
        status: "shipped",
        total_cents: 15_400,
        created_at: now,
        payment_method: "stripe",
        customer_name: "João Silva",
      },
      {
        id: "persona-ord-cancelled",
        status: "cancelled",
        total_cents: 4_500,
        created_at: now,
        customer_name: "Maria Souza",
      },
    ],
    low_stock: [
      {
        id: "persona-ls-1",
        title: "Charizard ex — Obsidian Flames",
        stock: 1,
        game_name: "pokemon",
        item_type: "product",
      },
      {
        id: "persona-ls-2",
        title: "Black Lotus (proxy display)",
        stock: 2,
        game_name: "mtg",
        item_type: "product",
      },
    ],
    open_tickets: 2,
    fulfillment_sla: {
      picking_overdue: 1,
      packing_overdue: 0,
      shipping_overdue: 0,
      tracking_delayed: 1,
    },
    generated_at: now,
  };
}

export function marceloPersonaStoreMineMock() {
  return [
    {
      id: PERSONA_STORE_ID,
      slug: PERSONA_STORE_SLUG,
      name: PERSONA_STORE_NAME,
      owner_id: "06e79f19-f866-4527-8ba2-979db485d78a",
      subscription_plan: "pro",
      shop_enabled: true,
    },
  ];
}
