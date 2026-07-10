"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { PeriodSelector } from "@/components/seller-dashboard/PeriodSelector";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useSellerIntelligence } from "@/hooks/useSellerIntelligence";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { useState } from "react";

type Period = "7d" | "30d" | "90d";

const SUGGESTION_LABELS = {
  lower: "Reduzir preço",
  hold: "Manter",
  raise: "Aumentar",
} as const;

export function IntelligencePage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useSellerIntelligence(period);

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader
            title="Inteligência de marketplace"
            description="Insights orientados a eventos — vendas, listings e pricing."
          />
          <PeriodSelector
            value={period}
            onChange={(p) => {
              if (p === "7d" || p === "30d" || p === "90d") setPeriod(p);
            }}
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Pedidos" value={String(data.sales.summary.orders)} />
              <Metric label="Receita" value={formatShopPrice(data.sales.summary.revenue_cents)} />
              <Metric
                label="Tendência"
                value={`${data.sales.summary.revenue_trend_pct > 0 ? "+" : ""}${data.sales.summary.revenue_trend_pct}%`}
              />
              <Metric label="Oportunidades pricing" value={String(data.pricing_opportunities)} />
            </div>

            <section className="surface-card p-4">
              <h3 className="mb-3 font-semibold">Performance de listings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="p-2">Carta</th>
                      <th className="p-2">Vendas</th>
                      <th className="p-2">Receita</th>
                      <th className="p-2">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_listings.map((row) => (
                      <tr key={row.listing_id ?? row.card_name} className="border-t border-white/5">
                        <td className="p-2">{row.card_name ?? "—"}</td>
                        <td className="p-2">{row.sales_count ?? 0}</td>
                        <td className="p-2">{formatShopPrice(row.revenue_cents ?? 0)}</td>
                        <td className="p-2">{((row.conversion_rate ?? 0) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="surface-card p-4">
                <h3 className="mb-3 font-semibold">Sugestões de preço</h3>
                <div className="space-y-2">
                  {data.pricing_suggestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma sugestão no momento.</p>
                  ) : (
                    data.pricing_suggestions.map((p) => (
                      <div key={p.listing_id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <p className="font-medium">{p.card_name ?? p.listing_id.slice(0, 8)}</p>
                        <p className="text-muted-foreground">
                          {formatShopPrice(p.listing_price_cents)} →{" "}
                          {formatShopPrice(p.suggested_price_cents)} ·{" "}
                          {SUGGESTION_LABELS[p.suggestion]}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="surface-card p-4">
                <h3 className="mb-3 font-semibold">Compradores em risco (churn)</h3>
                <div className="space-y-2">
                  {data.at_risk_buyers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum comprador em risco identificado.</p>
                  ) : (
                    data.at_risk_buyers.map((b) => (
                      <div key={b.buyer_id} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <span>{b.buyer_name ?? b.buyer_id.slice(0, 8)}</span>
                        <span className="text-amber-300">
                          {b.churn_score.toFixed(0)} · {b.days_since_last_order ?? "—"}d
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
