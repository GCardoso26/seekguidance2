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
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-luxury-mist">Pendente</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">
                {formatShopPrice(data?.pending_cents ?? 0)}
              </p>
              <p className="mt-1 text-xs text-luxury-mist">Aguardando transferência</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-luxury-mist">Concluído</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">
                {formatShopPrice(data?.completed_cents ?? 0)}
              </p>
              <p className="mt-1 text-xs text-luxury-mist">{data?.completed_count ?? 0} repasses</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-luxury-mist">Stripe Connect</p>
              <p className="mt-1 text-lg font-semibold">
                {data?.stripe_onboarding_complete ? "Ativo" : "Pendente"}
              </p>
              {data?.stripe_account_id && (
                <p className="mt-1 truncate text-xs text-luxury-mist">{data.stripe_account_id}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}
