"use client";

import Link from "next/link";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinanceStripe } from "@/hooks/useSellerFinance";
import { formatShopPrice } from "@/lib/marketplace-shop";

export function StripePage() {
  const { data, isLoading } = useFinanceStripe();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader title="Stripe" description="Conta Connect, transações e disputas." />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-4">
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Conta</p>
              <p className="font-mono text-sm">{data?.account_id ?? "—"}</p>
              <p className="mt-2">
                Onboarding:{" "}
                <span className={data?.onboarding_complete ? "text-success" : "text-warning"}>
                  {data?.onboarding_complete ? "Completo" : "Pendente"}
                </span>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface-card p-4">
                <p className="text-sm text-muted-foreground">Pedidos via Stripe</p>
                <p className="text-2xl font-semibold">{data?.stripe_orders_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">
                  {formatShopPrice(data?.stripe_revenue_cents ?? 0)} em receita
                </p>
              </div>
              <div className="surface-card p-4">
                <p className="text-sm text-muted-foreground">Disputas abertas</p>
                <p className="text-2xl font-semibold text-danger">{data?.open_disputes ?? 0}</p>
              </div>
            </div>
            <Link
              href="/vendedor/painel/configuracoes/pagamentos"
              className="inline-block text-sm text-primary underline"
            >
              Configurar pagamentos →
            </Link>
          </div>
        )}
      </main>
    </PageShell>
  );
}
