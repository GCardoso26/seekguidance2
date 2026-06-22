"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { useUserRole } from "@/hooks/useUserRole";

const AdminAnalyticsCharts = dynamic(
  () => import("@/components/admin/AdminAnalyticsCharts").then((m) => m.AdminAnalyticsCharts),
  { ssr: false, loading: () => <p className="mt-8 text-sm text-slate-400">Carregando gráficos…</p> },
);

const qc = new QueryClient();

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

function AnalyticsDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, isError } = useBusinessAnalytics(period);

  if (roleLoading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 text-slate-100">
        <p className="text-red-400">Acesso restrito a administradores.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-slate-400">
          ← Início
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100">
      <Link href="/admin" className="text-sm text-slate-400">
        ← Admin
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics de negócio</h1>
          <p className="text-sm text-slate-400">DAU/MAU, conversão, churn, LTV e uso por TCG</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                period === p.id ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="mt-6 text-slate-400">Carregando métricas…</p>}
      {isError && <p className="mt-6 text-red-400">Não foi possível carregar analytics.</p>}

      {data && (
        <>
          {(data.alerts?.length ?? 0) > 0 && (
            <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <h2 className="mt-8 text-lg font-semibold text-slate-200">Marketplace (30d)</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="GMV" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.marketplace.gmv_brl)} />
                <StatCard title="Conversão busca→compra" value={`${data.marketplace.conversion_rate}%`} />
                <StatCard title="Buscas" value={String(data.marketplace.searches)} />
                <StatCard title="Compras" value={String(data.marketplace.purchases)} />
              </div>
              <Link href="/admin/dashboard" className="mt-4 inline-block text-sm text-amber-400 hover:underline">
                Dashboard marketplace completo →
              </Link>
            </>
          )}

          <AdminAnalyticsCharts data={data} />
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-700 p-4">
      <div className="text-2xl font-bold text-amber-400">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
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
