"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrdersPagination } from "@/components/seller-dashboard/OrdersPagination";
import { PageError, PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  OrderDetailDrawer,
  OrdersBulkActionBar,
  OrdersDataTable,
  OrdersFilterBar,
  OrdersTabs,
} from "@/components/seller-orders";
import { useSellerOrders, useSellerPendingOrdersCount } from "@/hooks/useSellerOrders";
import { useSellerStore } from "@/hooks/useSellerStore";
import { parseOrderTab, type OrderTabId } from "@/lib/seller-orders-query";

const PAGE_SIZE = 25;

function PedidosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = parseOrderTab(searchParams.get("tab"));
  const drawerParam = searchParams.get("drawer");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [drawerOrderId, setDrawerOrderId] = useState<string | null>(drawerParam);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedOrderIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const bulkEnabled = tab === "to_separate" || tab === "paid";

  const { storeId } = useSellerStore();
  const { data: pendingCount = 0 } = useSellerPendingOrdersCount(Boolean(storeId));

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setRowSelection({});
  }, [tab, debouncedSearch, paymentMethod]);

  useEffect(() => {
    if (drawerParam) setDrawerOrderId(drawerParam);
  }, [drawerParam]);

  const { data, isLoading, error, refetch } = useSellerOrders({
    page,
    limit: PAGE_SIZE,
    tab: tab as OrderTabId,
    search: debouncedSearch || undefined,
    paymentMethod: paymentMethod || undefined,
    enabled: Boolean(storeId),
  });

  const openDrawer = useCallback(
    (orderId: string) => {
      setDrawerOrderId(orderId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("drawer", orderId);
      router.replace(`/vendedor/painel/pedidos?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const closeDrawer = useCallback(
    (open: boolean) => {
      if (open) return;
      setDrawerOrderId(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("drawer");
      const qs = params.toString();
      router.replace(qs ? `/vendedor/painel/pedidos?${qs}` : "/vendedor/painel/pedidos", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  function exportOrders() {
    if (!storeId) return;
    window.open(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/orders/export`, "_blank");
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageShell>
      <PageHeader
        title="Pedidos"
        description="Gerencie pedidos da loja por status e fluxo operacional."
        action={
          <button
            type="button"
            onClick={exportOrders}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5"
          >
            Exportar CSV
          </button>
        }
        meta={
          pendingCount > 0 ? (
            <span className="mt-2 inline-flex rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200">
              {pendingCount} aguardando pagamento
            </span>
          ) : null
        }
      />

      <OrdersTabs activeTab={tab} />
      <OrdersFilterBar
        search={search}
        onSearchChange={setSearch}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
      />

      {error instanceof Error ? (
        <PageError message="Não foi possível carregar os pedidos." onRetry={() => void refetch()} />
      ) : isLoading ? (
        <p className="text-sm text-luxury-mist">Carregando pedidos…</p>
      ) : (
        <>
          <OrdersDataTable
            orders={data?.orders ?? []}
            onSelectOrder={openDrawer}
            selectable={bulkEnabled}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
          <OrdersPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          <OrdersBulkActionBar
            selectedIds={selectedOrderIds}
            onClear={() => setRowSelection({})}
            onDone={() => void refetch()}
          />
        </>
      )}

      <OrderDetailDrawer
        orderId={drawerOrderId}
        open={Boolean(drawerOrderId)}
        onOpenChange={closeDrawer}
        onUpdated={() => void refetch()}
      />
    </PageShell>
  );
}

export default function PedidosPage() {
  return (
    <>
      <SellerHeader action={null} />
      <Suspense fallback={<p className="p-6 text-luxury-mist">Carregando…</p>}>
        <PedidosContent />
      </Suspense>
    </>
  );
}
