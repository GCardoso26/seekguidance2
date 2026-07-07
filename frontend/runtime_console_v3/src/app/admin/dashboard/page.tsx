"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AsyncPageBody, PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { formatCurrency } from "@/lib/format-currency";

type DashboardMetrics = {
  period_days: number;
  dau: number;
  total_events: number;
  marketplace_events: number;
  conversion_rate: number;
  searches: number;
  purchases: number;
  gmv_brl: number;
  paid_orders: number;
  top_cards: Array<{ card_name: string; purchases: number }>;
};

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics-dashboard", 30],
    queryFn: async () => {
      const res = await fetch("/api/analytics/dashboard?days=30");
      if (!res.ok) throw new Error("Dashboard indisponível");
      return res.json() as Promise<DashboardMetrics>;
    },
  });

  return (
    <PageShell>
      <PageHeader
        title="Dashboard marketplace"
        description="Métricas de marketplace — últimos 30 dias"
      />

      <AsyncPageBody isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard title="DAU" value={String(data.dau)} />
              <MetricCard title="Conversão busca→compra" value={`${data.conversion_rate}%`} />
              <MetricCard title="GMV (30d)" value={formatCurrency(data.gmv_brl)} />
              <MetricCard title="Eventos" value={String(data.total_events)} />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <MetricCard title="Buscas" value={String(data.searches)} />
              <MetricCard title="Compras (eventos)" value={String(data.purchases)} />
              <MetricCard title="Pedidos pagos" value={String(data.paid_orders)} />
            </div>

            <h2 className="text-lg font-semibold">Top cartas vendidas</h2>
            <ul className="space-y-2">
              {data.top_cards.length === 0 && (
                <li className="text-sm text-luxury-mist">Sem dados de compra ainda.</li>
              )}
              {data.top_cards.map((row) => (
                <li
                  key={row.card_name}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm">{row.card_name}</span>
                  <span className="text-sm font-semibold text-luxury-gold">{row.purchases}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/admin/retention" className="text-luxury-gold hover:underline">
                Dashboard de retenção →
              </Link>
              <Link href="/admin/analytics" className="text-luxury-gold hover:underline">
                Analytics completo →
              </Link>
            </div>
          </>
        )}
      </AsyncPageBody>
    </PageShell>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-bold text-luxury-gold">{value}</p>
      <p className="text-sm text-luxury-mist">{title}</p>
    </div>
  );
}
