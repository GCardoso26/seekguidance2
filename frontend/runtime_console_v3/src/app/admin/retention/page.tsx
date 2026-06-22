"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/format-currency";

type RetentionData = {
  period_days: number;
  wau: number;
  mau: number;
  avg_session_seconds: number;
  funnel: {
    page_views: number;
    searches: number;
    card_views: number;
    add_to_carts: number;
    purchases: number;
  };
  funnel_rates: {
    search_rate: number;
    detail_rate: number;
    cart_rate: number;
    purchase_rate: number;
    overall_conversion: number;
  };
  xp_distribution: Array<{ current_level: string; count: number }>;
  gmv_brl: number;
  top_sellers: Array<{ seller_name: string; orders: number; gmv_brl: number }>;
};

export default function RetentionDashboardPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["retention", 30],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/retention?days=30");
      if (!res.ok) throw new Error("Retenção indisponível");
      return res.json() as Promise<RetentionData>;
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
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-luxury-mist">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-luxury-frost">Retenção — Judge-TCG</h1>
        <p className="text-sm text-luxury-mist">Funil, Liga Pass e GMV — últimos 30 dias</p>

        {isLoading && <p className="mt-6 text-luxury-mist">Carregando…</p>}
        {isError && <p className="mt-6 text-red-400">Não foi possível carregar métricas.</p>}

        {data && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard title="WAU" value={String(data.wau)} />
              <StatCard title="MAU" value={String(data.mau)} />
              <StatCard title="Sessão média" value={`${data.avg_session_seconds}s`} />
            </div>

            <Card className="mt-6 border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-luxury-frost">Funil de conversão (30 dias)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FunnelBar label="Page views" value={data.funnel.page_views} max={data.funnel.page_views} />
                <FunnelBar
                  label="Buscas"
                  value={data.funnel.searches}
                  rate={data.funnel_rates.search_rate}
                  max={data.funnel.page_views}
                />
                <FunnelBar
                  label="Detalhe da carta"
                  value={data.funnel.card_views}
                  rate={data.funnel_rates.detail_rate}
                  max={data.funnel.page_views}
                />
                <FunnelBar
                  label="Add to cart"
                  value={data.funnel.add_to_carts}
                  rate={data.funnel_rates.cart_rate}
                  max={data.funnel.page_views}
                />
                <FunnelBar
                  label="Compras"
                  value={data.funnel.purchases}
                  rate={data.funnel_rates.purchase_rate}
                  max={data.funnel.page_views}
                />
              </CardContent>
            </Card>

            <Card className="mt-6 border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-luxury-frost">Distribuição Liga Pass</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {data.xp_distribution.map((level) => (
                    <div key={level.current_level} className="text-center">
                      <div className="text-2xl font-bold text-luxury-gold">{level.count}</div>
                      <div className="text-sm capitalize text-luxury-mist">{level.current_level}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-luxury-frost">GMV — {formatCurrency(data.gmv_brl)}</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="mb-3 text-sm font-semibold text-luxury-mist">Top vendedores</h3>
                <ul className="space-y-2">
                  {data.top_sellers.length === 0 && (
                    <li className="text-sm text-luxury-mist">Sem vendas no período.</li>
                  )}
                  {data.top_sellers.map((s) => (
                    <li
                      key={s.seller_name}
                      className="flex justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                    >
                      <span>{s.seller_name}</span>
                      <span className="text-luxury-gold">
                        {formatCurrency(s.gmv_brl)} ({s.orders} pedidos)
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Link href="/admin/dashboard" className="mt-8 inline-block text-sm text-luxury-gold">
              Dashboard marketplace →
            </Link>
          </>
        )}
      </div>
    </MobileLayout>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-bold text-luxury-gold">{value}</p>
      <p className="text-sm text-luxury-mist">{title}</p>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  rate,
  max,
}: {
  label: string;
  value: number;
  rate?: number;
  max: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-luxury-mist">
        <span>{label}</span>
        <span>
          {value.toLocaleString("pt-BR")}
          {rate !== undefined ? ` (${rate}%)` : ""}
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-luxury-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
