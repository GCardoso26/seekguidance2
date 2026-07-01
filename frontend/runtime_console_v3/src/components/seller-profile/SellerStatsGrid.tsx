"use client";

import { Package, ShoppingBag, Timer, TrendingUp } from "lucide-react";
import type { SellerPublicMetrics, SellerRecentActivity } from "@/lib/seller-analytics-query";

type Props = {
  metrics: SellerPublicMetrics;
  activity: SellerRecentActivity;
};

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function SellerStatsGrid({ metrics, activity }: Props) {
  const items = [
    {
      label: "Vendas",
      value: formatNumber(metrics.total_sales),
      sub: `${Math.round(metrics.sell_through_rate * 100)}% conversão`,
      icon: ShoppingBag,
    },
    {
      label: "Ativos",
      value: formatNumber(metrics.total_listings_active),
      sub: `${formatNumber(metrics.total_listings_sold)} vendidos`,
      icon: Package,
    },
    {
      label: "Envio médio",
      value: metrics.average_ship_time_hours != null ? `${metrics.average_ship_time_hours}h` : "—",
      sub: "últimos 90 dias",
      icon: Timer,
    },
    {
      label: "30 dias",
      value: formatNumber(activity.sales_last_30d),
      sub:
        activity.trend === "up"
          ? "tendência ↑"
          : activity.trend === "down"
            ? "tendência ↓"
            : "estável",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/50 bg-card p-4 shadow-card"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <item.icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
