"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrdersManager } from "@/components/seller-dashboard/OrdersManager";
import { PageError, PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useSellerPanel } from "@/contexts/SellerPanelContext";
import { useSellerOrders, useSellerPendingOrdersCount } from "@/hooks/useSellerOrders";
import { useSellerStore } from "@/hooks/useSellerStore";
import { planHasFeature } from "@/lib/seller-plans";

const PAGE_SIZE = 20;

function VendasContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const { storeId } = useSellerStore();
  const { plan } = useSellerPanel();
  const { data: pendingCount = 0 } = useSellerPendingOrdersCount(Boolean(storeId));

  const { data, isLoading, error, refetch } = useSellerOrders({
    page,
    limit: PAGE_SIZE,
    status: statusFilter,
    enabled: Boolean(storeId),
  });

  function exportOrders() {
    if (!storeId) return;
    window.open(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/orders/export`, "_blank");
  }

  function handleStatusChange(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showAnalytics = planHasFeature(plan, "analytics");

  return (
    <PageShell>
      <PageHeader
        title="Vendas"
        description="Pedidos recebidos na sua loja."
        meta={
          pendingCount > 0 ? (
            <span
              className="mt-2 inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-warning"
              data-testid="pending-orders-badge"
            >
              {pendingCount} pendente{pendingCount === 1 ? "" : "s"}
            </span>
          ) : null
        }
      />

      {!showAnalytics && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Estatísticas avançadas disponíveis no plano Lojista.{" "}
          <Link href="/vendedor/painel/planos" className="text-primary underline">
            Ver planos
          </Link>
        </div>
      )}
      {showAnalytics && (
        <p className="text-sm text-muted-foreground">
          <Link href="/vendedor/painel/estatisticas" className="text-primary hover:underline">
            Ver estatísticas de vendas →
          </Link>
          {totalPages > 1 && !isLoading ? (
            <span className="ml-2 text-xs text-muted-foreground/70">
              · página {page} de {totalPages}
            </span>
          ) : null}
        </p>
      )}

      {error instanceof Error ? (
        <PageError message="Não foi possível carregar seus pedidos." onRetry={() => void refetch()} />
      ) : (
        <OrdersManager
          orders={data?.orders ?? []}
          isLoading={isLoading}
          page={page}
          total={total}
          limit={PAGE_SIZE}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          onPageChange={setPage}
          onUpdated={() => void refetch()}
          onExport={exportOrders}
        />
      )}
    </PageShell>
  );
}

export default function VendedorVendasPage() {
  return (
    <>
      <SellerHeader action={null} />
      <Suspense fallback={<p className="p-6 text-muted-foreground">Carregando…</p>}>
        <VendasContent />
      </Suspense>
    </>
  );
}
