"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { AsyncPageBody, PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";

const AdminAnalyticsCharts = dynamic(
  () => import("@/components/admin/AdminAnalyticsCharts").then((m) => m.AdminAnalyticsCharts),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Carregando gráficos…</p> },
);

const qc = new QueryClient();

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

function AnalyticsDashboard() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, isError, refetch } = useBusinessAnalytics(period);

  return (
    <PageShell>
      <PageHeader
        title="Analytics de negócio"
        description="DAU/MAU, conversão, churn, LTV e uso por TCG"
        action={
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  period === p.id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <AsyncPageBody isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
        {data && (
          <>
            {(data.alerts?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  Alertas
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-amber-200/90">
                  {data.alerts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="DAU (aprox.)" value={String(data.dau)} />
              <StatCard title="MAU (período)" value={String(data.mau)} />
              <StatCard
                title="Conversão Free→Pro"
                value={`${data.conversionRatePercent}%`}
                sub={`${data.proSubscribers} Pro / ${data.totalUsers} usuários`}
              />
              <StatCard title="Churn" value={`${data.churnRatePercent}%`} />
              <StatCard
                title="LTV médio"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  data.ltvAverageBrl,
                )}
              />
              <StatCard
                title="Receita total (invoices)"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  data.ltvTotalBrl,
                )}
              />
            </div>

            {data.marketplace && (
              <>
                <h2 className="text-lg font-semibold">Marketplace (30d)</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="GMV"
                    value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      data.marketplace.gmv_brl,
                    )}
                  />
                  <StatCard title="Conversão busca→compra" value={`${data.marketplace.conversion_rate}%`} />
                  <StatCard title="Buscas" value={String(data.marketplace.searches)} />
                  <StatCard title="Compras" value={String(data.marketplace.purchases)} />
                </div>
                <Link href="/admin/dashboard" className="inline-block text-sm text-primary hover:underline">
                  Dashboard marketplace completo →
                </Link>
              </>
            )}

            <AdminAnalyticsCharts data={data} />
          </>
        )}
      </AsyncPageBody>
    </PageShell>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <QueryClientProvider client={qc}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  );
}
