"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics-dashboard", 30],
    queryFn: async () => {
      const res = await fetch("/api/analytics/dashboard?days=30");
      if (!res.ok) throw new Error("Dashboard indisponível");
      return res.json() as Promise<DashboardMetrics>;
    },
    enabled: isAdmin,
  });

  if (roleLoading) return null;

  if (!isAdmin) {
    return (
      <MobileLayout>
        <div className="p-8 text-red-400">Acesso restrito a administradores.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin" className="text-sm text-luxury-mist">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-luxury-frost">Dashboard Judge-TCG</h1>
        <p className="text-sm text-luxury-mist">Métricas de marketplace — últimos 30 dias</p>

        {isLoading && <p className="mt-6 text-luxury-mist">Carregando…</p>}
        {isError && <p className="mt-6 text-red-400">Não foi possível carregar métricas.</p>}

        {data && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard title="DAU" value={String(data.dau)} />
              <MetricCard title="Conversão busca→compra" value={`${data.conversion_rate}%`} />
              <MetricCard title="GMV (30d)" value={formatCurrency(data.gmv_brl)} />
              <MetricCard title="Eventos" value={String(data.total_events)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              <MetricCard title="Buscas" value={String(data.searches)} />
              <MetricCard title="Compras (eventos)" value={String(data.purchases)} />
              <MetricCard title="Pedidos pagos" value={String(data.paid_orders)} />
            </div>

            <h2 className="mt-8 text-lg font-semibold text-luxury-frost">Top cartas vendidas</h2>
            <ul className="mt-3 space-y-2">
              {data.top_cards.length === 0 && (
                <li className="text-sm text-luxury-mist">Sem dados de compra ainda.</li>
              )}
              {data.top_cards.map((row) => (
                <li
                  key={row.card_name}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-luxury-frost">{row.card_name}</span>
                  <span className="text-sm font-semibold text-luxury-gold">{row.purchases}</span>
                </li>
              ))}
            </ul>

            <Link href="/admin/retention" className="mt-4 inline-block text-sm text-luxury-gold">
              Dashboard de retenção →
            </Link>
            <Link href="/admin/analytics" className="mt-4 ml-4 inline-block text-sm text-luxury-gold">
              Ver analytics de negócio completo →
            </Link>
          </>
        )}
      </div>
    </MobileLayout>
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
