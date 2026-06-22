"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { SalesTable } from "@/components/seller-dashboard/SalesTable";
import { useSellerStore } from "@/hooks/useSellerStore";
import type { StoreOrder } from "@/components/store/OrdersList";

function VendasContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const { storeId } = useSellerStore();

  const { data, refetch } = useQuery({
    queryKey: ["seller-orders", statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`/api/seller/orders${qs}`);
      if (!res.ok) return { orders: [] };
      return res.json() as Promise<{ orders: StoreOrder[] }>;
    },
    enabled: Boolean(storeId),
  });

  function exportOrders() {
    if (!storeId) return;
    window.open(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/orders/export`, "_blank");
  }

  return (
    <main className="flex-1 space-y-4 overflow-y-auto p-6">
      <h2 className="text-xl font-bold">Minhas vendas</h2>
      <SalesTable
        orders={data?.orders ?? []}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onUpdated={() => void refetch()}
        onExport={exportOrders}
      />
    </main>
  );
}

export default function VendedorVendasPage() {
  return (
    <>
      <SellerHeader action={null} />
      <Suspense fallback={<p className="p-6 text-luxury-mist">Carregando…</p>}>
        <VendasContent />
      </Suspense>
    </>
  );
}
