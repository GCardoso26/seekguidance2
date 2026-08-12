"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AsyncPageBody,
  PageEmpty,
  PageHeader,
  PageShell,
  PageSkeleton,
} from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PeriodSelector } from "@/components/seller-dashboard/PeriodSelector";
import { StatCard } from "@/components/seller-dashboard/StatCard";
import { useSellerStore } from "@/hooks/useSellerStore";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { planHasFeature, resolveSellerPlan } from "@/lib/seller-plans";

const SalesChart = dynamic(
  () => import("@/components/dashboard/SalesChart").then((m) => m.SalesChart),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted/50" />, ssr: false },
);

type Period = "7d" | "30d" | "90d" | "1y" | "all";

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { dashboard, isLoading: storeLoading } = useSellerStore();
  const plan = resolveSellerPlan(
    (dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan as string | undefined,
  );
  const hasAnalytics = planHasFeature(plan, "analytics");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["seller-stats", period],
    queryFn: async () => {
      const res = await fetch(`/api/seller/stats?period=${period}`);
      if (!res.ok) throw new Error("stats_failed");
      return res.json();
    },
    enabled: hasAnalytics,
  });

  if (storeLoading) {
    return (
      <PageShell>
        <PageSkeleton rows={5} />
      </PageShell>
    );
  }

  if (!hasAnalytics) {
    return (
      <>
        <SellerHeader action={null} />
        <PageShell>
          <PageEmpty
            variant="panel"
            title="Analytics disponível no plano Lojista"
            action={{ label: "Ver planos", href: "/vendedor/painel/planos" }}
          />
        </PageShell>
      </>
    );
  }

  const chartData = (data?.revenue?.chart ?? []).map(
    (row: { date?: string; revenue_cents?: number }) => ({
      day: String(row.date ?? ""),
      revenue_cents: Number(row.revenue_cents ?? 0),
    }),
  );

  return (
    <>
      <SellerHeader action={null} />
      <PageShell className="space-y-6">
        <PageHeader
          title="Estatísticas de vendas"
          action={<PeriodSelector value={period} onChange={setPeriod} />}
        />

        <AsyncPageBody
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          errorMessage="Não foi possível carregar as estatísticas."
          skeletonRows={5}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Receita"
              value={formatShopPrice(Number(data?.revenue?.total_cents ?? 0))}
            />
            <StatCard label="Vendas" value={String(data?.sales_count ?? 0)} />
            <StatCard label="Compradores únicos" value={String(data?.unique_buyers ?? 0)} />
          </div>

          <div className="surface-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Receita</h3>
            <SalesChart data={chartData} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-4">
              <h3 className="mb-3 font-semibold">Top produtos</h3>
              <ul className="space-y-2 text-sm">
                {(data?.top_cards ?? []).map(
                  (item: { name: string; count: number; revenue_cents: number }) => (
                    <li key={item.name} className="flex justify-between gap-2">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.count} · {formatShopPrice(item.revenue_cents)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="surface-card p-4">
              <h3 className="mb-3 font-semibold">Ticket médio</h3>
              <p className="text-2xl font-bold">
                {formatShopPrice(Math.round(Number(data?.average_order_value ?? 0) * 100))}
              </p>
            </div>
          </div>
        </AsyncPageBody>
      </PageShell>
    </>
  );
}
