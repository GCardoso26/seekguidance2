"use client";

import { useMemo } from "react";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { useFinanceRevenue } from "@/hooks/useSellerFinance";
import { useSellerStore } from "@/hooks/useSellerStore";
import { formatShopPrice } from "@/lib/marketplace-shop";

export type DashboardKpiPeriod = "today" | "yesterday" | "7d" | "30d";

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  sub?: string;
};

export function useDashboardKpis(period: DashboardKpiPeriod) {
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview();
  const revenue7d = useFinanceRevenue("7d");
  const revenue30d = useFinanceRevenue("30d");
  const { dashboard } = useSellerStore();

  const kpis: DashboardKpi[] = useMemo(() => {
    const m = overview?.metrics;
    const kpisLegacy = dashboard?.kpis as Record<string, unknown> | undefined;
    const activeListings = Number(
      (kpisLegacy?.active_listings as number | undefined) ?? 0,
    );

    if (period === "today" && m) {
      return [
        { id: "revenue", label: "Receita", value: formatShopPrice(m.revenue_today_cents) },
        { id: "orders_pending", label: "Aguard. pagamento", value: String(m.pending_payment) },
        { id: "orders_ship", label: "Para enviar", value: String(m.to_separate) },
        { id: "shipped", label: "Enviados hoje", value: String(m.shipped_today) },
        { id: "listings", label: "Anúncios ativos", value: String(activeListings) },
      ];
    }

    const rev = period === "7d" ? revenue7d.data : revenue30d.data;
    const totals = rev?.totals;
    const orders = totals?.orders ?? 0;
    const net = totals?.net_cents ?? 0;
    const avgTicket = orders > 0 ? Math.round(net / orders) : 0;

    if (period === "yesterday" && revenue7d.data?.rows?.length) {
      const rows = revenue7d.data.rows;
      const yesterday = rows.length >= 2 ? rows[rows.length - 2] : rows[0];
      return [
        { id: "revenue", label: "Receita", value: formatShopPrice(yesterday?.net_cents ?? 0) },
        { id: "orders", label: "Pedidos", value: String(yesterday?.orders ?? 0) },
        { id: "listings", label: "Anúncios ativos", value: String(activeListings) },
      ];
    }

    return [
      { id: "revenue", label: "Receita líquida", value: formatShopPrice(net) },
      { id: "orders", label: "Pedidos", value: String(orders) },
      {
        id: "ticket",
        label: "Ticket médio",
        value: orders > 0 ? formatShopPrice(avgTicket) : "—",
      },
      { id: "listings", label: "Anúncios ativos", value: String(activeListings) },
    ];
  }, [period, overview, revenue7d.data, revenue30d.data, dashboard]);

  const isLoading =
    overviewLoading ||
    (period === "7d" || period === "yesterday" ? revenue7d.isLoading : false) ||
    (period === "30d" ? revenue30d.isLoading : false);

  return { kpis, isLoading };
}
