"use client";

import Link from "next/link";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useFinancePix } from "@/hooks/useSellerFinance";
import { formatShopPrice } from "@/lib/marketplace-shop";

export function PixPage() {
  const { data, isLoading } = useFinancePix();

  return (
    <PageShell>
      <SellerHeader action={null} />
      <main className="flex-1 space-y-4 overflow-y-auto p-6">
        <PageHeader title="PIX" description="Transações PIX recebidas e confirmações pendentes." />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Chave PIX</p>
              <p className="mt-1 font-semibold">
                {data?.pix_key_configured ? "Configurada" : "Não configurada"}
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="mt-1 text-2xl font-semibold text-warning">{data?.pending_count ?? 0}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm text-muted-foreground">Confirmados</p>
              <p className="mt-1 text-2xl font-semibold text-success">{data?.confirmed_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                {formatShopPrice(data?.revenue_cents ?? 0)} recebidos
              </p>
            </div>
          </div>
        )}
        <Link
          href="/vendedor/painel/configuracoes/pagamentos"
          className="inline-block text-sm text-primary underline"
        >
          Configurar PIX →
        </Link>
      </main>
    </PageShell>
  );
}
