"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { PeriodSelector } from "@/components/seller-dashboard/PeriodSelector";
import { StatCard } from "@/components/seller-dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { useSellerStore } from "@/hooks/useSellerStore";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { planHasFeature } from "@/lib/seller-plans";

const SalesChart = dynamic(
  () => import("@/components/dashboard/SalesChart").then((m) => m.SalesChart),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" />, ssr: false },
);

type Period = "7d" | "30d" | "90d" | "1y" | "all";

export default function EstatisticasPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { dashboard } = useSellerStore();
  const plan = String((dashboard?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free");

  const { data, isLoading } = useQuery({
    queryKey: ["seller-stats", period],
    queryFn: async () => {
      const res = await fetch(`/api/seller/stats?period=${period}`);
      if (!res.ok) throw new Error("stats_failed");
      return res.json();
    },
    enabled: planHasFeature(plan, "analytics"),
  });

  if (!planHasFeature(plan, "analytics")) {
    return (
      <main className="p-8 text-center">
        <p className="text-luxury-mist">Analytics disponível no plano Lojista.</p>
        <Button asChild className="mt-4">
          <Link href="/vendedor/painel/planos">Ver planos</Link>
        </Button>
      </main>
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
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Estatísticas de vendas</h2>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {isLoading && <p className="text-luxury-mist">Carregando…</p>}

        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Receita"
                value={formatShopPrice(Number(data.revenue?.total_cents ?? 0))}
              />
              <StatCard label="Vendas" value={String(data.sales_count ?? 0)} />
              <StatCard label="Compradores únicos" value={String(data.unique_buyers ?? 0)} />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase text-luxury-mist">Receita</h3>
              <SalesChart data={chartData} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 font-semibold">Top produtos</h3>
                <ul className="space-y-2 text-sm">
                  {(data.top_cards ?? []).map(
                    (item: { name: string; count: number; revenue_cents: number }) => (
                      <li key={item.name} className="flex justify-between gap-2">
                        <span>{item.name}</span>
                        <span className="text-luxury-mist">
                          {item.count} · {formatShopPrice(item.revenue_cents)}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 font-semibold">Ticket médio</h3>
                <p className="text-2xl font-bold">
                  {formatShopPrice(Math.round(Number(data.average_order_value ?? 0) * 100))}
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
