"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Clock, DollarSign, Package, Truck } from "lucide-react";
import { formatShopPrice } from "@/lib/marketplace-shop";
import type { DashboardOverviewMetrics } from "@/types/seller-dashboard-overview";

export type DashboardMetric = {
  id: string;
  label: string;
  value: number | string;
  sublabel?: string;
  trend?: "up" | "down" | "stable";
  icon: LucideIcon;
  color: string;
  href: string;
};

function buildMetrics(metrics: DashboardOverviewMetrics): DashboardMetric[] {
  const delta = metrics.revenue_delta_cents;
  const trend: "up" | "down" | "stable" = delta > 0 ? "up" : delta < 0 ? "down" : "stable";
  const deltaLabel =
    delta === 0
      ? "igual a ontem"
      : `${delta > 0 ? "+" : ""}${formatShopPrice(Math.abs(delta))} vs ontem`;

  return [
    {
      id: "pending_payment",
      label: "Pedidos aguardando pagamento",
      value: metrics.pending_payment,
      icon: Clock,
      color: "text-amber-400",
      href: "/vendedor/painel/pedidos?tab=pending_payment",
    },
    {
      id: "to_separate",
      label: "Pedidos para separar",
      value: metrics.to_separate,
      icon: Package,
      color: "text-blue-400",
      href: "/vendedor/painel/pedidos?tab=to_separate",
    },
    {
      id: "shipped_today",
      label: "Pedidos enviados hoje",
      value: metrics.shipped_today,
      icon: Truck,
      color: "text-green-400",
      href: "/vendedor/painel/pedidos?tab=shipped",
    },
    {
      id: "revenue_today",
      label: "Receita hoje",
      value: formatShopPrice(metrics.revenue_today_cents),
      sublabel: deltaLabel,
      trend,
      icon: DollarSign,
      color: "text-emerald-400",
      href: "/vendedor/painel/financeiro/receitas",
    },
  ];
}

type Props = {
  metrics?: DashboardOverviewMetrics;
};

export function MetricCardsRow({ metrics }: Props) {
  if (!metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  const cards = buildMetrics(metrics);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-metrics">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            href={card.href}
            className="surface-card p-4 transition hover:border-primary/40 hover:bg-white/[0.07]"
          >
            <div className="flex items-start justify-between gap-2">
              <Icon className={`h-5 w-5 ${card.color}`} aria-hidden />
              <span className="text-2xl font-bold tabular-nums">{card.value}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
            {card.sublabel && (
              <p
                className={`mt-1 text-xs ${
                  card.trend === "up"
                    ? "text-emerald-300"
                    : card.trend === "down"
                      ? "text-red-300"
                      : "text-muted-foreground/70"
                }`}
              >
                {card.sublabel}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
