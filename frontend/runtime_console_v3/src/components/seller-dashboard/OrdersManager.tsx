"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OrderFilters } from "@/components/store/OrderFilters";
import type { SellerOrderRow } from "@/types/seller-order";
import { OrderCards, OrdersEmptyState } from "./OrderCards";
import { OrdersPagination } from "./OrdersPagination";
import { PageSkeleton } from "./PageShell";

const OrdersDesktopView = dynamic(
  () => import("./OrdersDesktopView").then((mod) => mod.OrdersDesktopView),
  { loading: () => <PageSkeleton rows={6} />, ssr: false },
);

type ViewMode = "pending" | "table" | "cards";

type Props = {
  orders: SellerOrderRow[];
  isLoading?: boolean;
  page?: number;
  total?: number;
  limit?: number;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onPageChange?: (page: number) => void;
  onUpdated: () => void;
  onExport?: () => void;
};

export function OrdersManager({
  orders,
  isLoading,
  page = 1,
  total = 0,
  limit = 20,
  statusFilter,
  onStatusChange,
  onPageChange,
  onUpdated,
  onExport,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    setViewMode(mobile ? "cards" : "table");
  }, []);

  if (isLoading || viewMode === "pending") return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderFilters status={statusFilter} onChange={onStatusChange} />
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="text-sm text-primary underline hover:text-primary"
          >
            Exportar CSV
          </button>
        )}
      </div>

      {orders.length === 0 && total === 0 ? (
        <OrdersEmptyState />
      ) : viewMode === "cards" ? (
        <OrderCards orders={orders} onUpdated={onUpdated} />
      ) : (
        <OrdersDesktopView orders={orders} />
      )}

      {onPageChange && (
        <OrdersPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
