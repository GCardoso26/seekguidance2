import { describe, expect, it } from "vitest";
import { buildOperationalActions } from "@/lib/seller-operational-actions";
import type { DashboardOverviewResponse } from "@/types/seller-dashboard-overview";

const baseOverview: DashboardOverviewResponse = {
  metrics: {
    pending_payment: 0,
    to_separate: 0,
    shipped_today: 0,
    revenue_today_cents: 0,
  },
  fulfillment_sla: {
    picking_overdue: 0,
    packing_overdue: 0,
    shipping_overdue: 0,
    tracking_delayed: 0,
  },
  low_stock: [],
  open_tickets: 0,
  recent_orders: [],
  reputation: { trust_score: 85 },
};

describe("buildOperationalActions", () => {
  it("retorna vazio sem overview", () => {
    expect(buildOperationalActions(undefined)).toEqual([]);
  });

  it("prioriza ações críticas (envio e SLA)", () => {
    const actions = buildOperationalActions(
      {
        ...baseOverview,
        metrics: { ...baseOverview.metrics, to_separate: 3 },
        fulfillment_sla: {
          picking_overdue: 2,
          packing_overdue: 0,
          shipping_overdue: 0,
          tracking_delayed: 0,
        },
      },
      { disputesCount: 1 },
    );

    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions[0].severity).toBe("critical");
    expect(actions.some((a) => a.id === "to_separate" && a.cta === "Enviar")).toBe(true);
    expect(actions.some((a) => a.id === "sla_overdue")).toBe(true);
  });

  it("inclui tickets e estoque baixo", () => {
    const actions = buildOperationalActions({
      ...baseOverview,
      open_tickets: 2,
      low_stock: [
        { id: "1", title: "Black Lotus", stock: 1, image_url: null },
        { id: "2", title: "Mox Pearl", stock: 0, image_url: "https://img.test/a.jpg" },
      ],
    });

    expect(actions.find((a) => a.id === "tickets")?.count).toBe(2);
    expect(actions.find((a) => a.id === "low_stock")?.count).toBe(2);
    expect(actions.find((a) => a.id === "no_image")?.count).toBe(1);
  });

  it("alerta trust score baixo e anúncios pausados", () => {
    const actions = buildOperationalActions(
      {
        ...baseOverview,
        reputation: { trust_score: 55 },
      },
      { inactiveListings: 4, pendingPayoutCents: 5000 },
    );

    expect(actions.find((a) => a.id === "trust")?.cta).toBe("Melhorar");
    expect(actions.find((a) => a.id === "paused")?.count).toBe(4);
    expect(actions.find((a) => a.id === "payouts")).toBeDefined();
  });
});
