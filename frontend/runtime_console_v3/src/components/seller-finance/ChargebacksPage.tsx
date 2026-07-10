"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinanceChargebacks } from "@/hooks/useSellerFinanceS6";
import { formatShopPrice } from "@/lib/marketplace-shop";

const CB_STATUS: Record<string, string> = {
  opened: "Aberto",
  under_review: "Em análise",
  won: "Ganho",
  lost: "Perdido",
  closed: "Encerrado",
};

export function ChargebacksPage() {
  const { data, isLoading } = useFinanceChargebacks();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader
          title="Chargebacks"
          description="Disputas Stripe e bloqueios de settlement."
        />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <div className="surface-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Abertos</p>
              <p className="text-2xl font-semibold text-warning">{data?.open_count ?? 0}</p>
            </div>
            <div className="space-y-2">
              {(data?.items ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum chargeback registrado.</p>
              ) : (
                data?.items.map((cb) => (
                  <div
                    key={cb.id}
                    className="surface-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{CB_STATUS[cb.status] ?? cb.status}</span>
                      <span className="text-lg font-semibold text-warning">
                        {formatShopPrice(cb.amount_cents)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cb.reason ?? "Sem motivo"} · {cb.payment_method}
                    </p>
                    {cb.evidence_due_by && (
                      <p className="mt-1 text-xs text-danger">
                        Prazo evidências: {new Date(cb.evidence_due_by).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}
