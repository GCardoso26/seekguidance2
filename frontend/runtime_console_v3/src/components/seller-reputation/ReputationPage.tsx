"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { FulfillmentSlaWidget } from "@/components/seller-dashboard/overview/FulfillmentSlaWidget";
import { TrustBadge } from "@/components/seller-reputation/TrustBadge";
import { useSellerReputation } from "@/hooks/useSellerReputation";

const COMPONENT_LABELS: Record<string, string> = {
  sales: "Vendas",
  delivery: "Entrega / SLA",
  quality: "Qualidade (reviews)",
  compliance: "Compliance",
  fraud_penalty: "Penalidade fraude",
};

export function ReputationPage() {
  const { data, isLoading } = useSellerReputation();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-6 overflow-y-auto p-6">
        <PageHeader
          title="Reputação"
          description="Score derivado de pedidos, SLA, chargebacks e reviews — não só avaliações."
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="surface-card p-5 lg:col-span-1">
                <p className="text-sm text-muted-foreground">Trust Score</p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-success">
                  {data.trust_score.toFixed(1)}
                </p>
                <div className="mt-3">
                  <TrustBadge level={data.seller_level} badges={data.badges} trustScore={data.trust_score} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {data.orders_completed} pedidos concluídos · v{data.version}
                </p>
              </div>
              <div className="surface-card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Componentes do score</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(data.components).map(([key, val]) => (
                    <div key={key} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span>{COMPONENT_LABELS[key] ?? key}</span>
                      <span className="font-medium tabular-nums">{Number(val).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {data.alerts.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Alertas de reputação
                </h3>
                <div className="space-y-2">
                  {data.alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        a.severity === "high"
                          ? "border-red-500/30 bg-red-500/10 text-red-200"
                          : a.severity === "medium"
                            ? "border-amber-500/30 bg-amber-500/10 text-warning"
                            : "border-border bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {a.message}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                SLA operacional
              </h3>
              <FulfillmentSlaWidget
                sla={{
                  picking_overdue: data.sla_detail?.picking_overdue ?? 0,
                  packing_overdue: data.sla_detail?.packing_overdue ?? 0,
                  shipping_overdue: data.sla_detail?.shipping_overdue ?? 0,
                  tracking_delayed: data.sla_detail?.tracking_delayed ?? 0,
                }}
              />
            </section>
          </>
        ) : null}
      </main>
    </PageShell>
  );
}
