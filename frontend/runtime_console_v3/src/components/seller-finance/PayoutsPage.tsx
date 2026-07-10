"use client";

import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinancePayouts } from "@/hooks/useSellerFinance";
import { formatShopPrice } from "@/lib/marketplace-shop";

export function PayoutsPage() {
  const { data, isLoading } = useFinancePayouts();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader title="Repasses" description="Status de repasses Stripe Connect e saldo pendente." />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="mt-1 text-2xl font-semibold text-warning">
                {formatShopPrice(data?.pending_cents ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Aguardando transferência</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Concluído</p>
              <p className="mt-1 text-2xl font-semibold text-success">
                {formatShopPrice(data?.completed_cents ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{data?.completed_count ?? 0} repasses</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Stripe Connect</p>
              <p className="mt-1 text-lg font-semibold">
                {data?.stripe_onboarding_complete ? "Ativo" : "Pendente"}
              </p>
              {data?.stripe_account_id && (
                <p className="mt-1 truncate text-xs text-muted-foreground">{data.stripe_account_id}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}
