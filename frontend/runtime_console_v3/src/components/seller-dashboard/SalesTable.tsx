"use client";

import { OrdersList, type StoreOrder } from "@/components/store/OrdersList";
import { OrderFilters } from "@/components/store/OrderFilters";

type Props = {
  orders: StoreOrder[];
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onUpdated: () => void;
  onExport?: () => void;
};

export function SalesTable({
  orders,
  statusFilter,
  onStatusChange,
  onUpdated,
  onExport,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderFilters status={statusFilter} onChange={onStatusChange} />
        {onExport && (
          <button type="button" onClick={onExport} className="text-sm text-primary underline">
            Exportar CSV
          </button>
        )}
      </div>
      <OrdersList orders={orders} onUpdated={onUpdated} />
    </div>
  );
}
