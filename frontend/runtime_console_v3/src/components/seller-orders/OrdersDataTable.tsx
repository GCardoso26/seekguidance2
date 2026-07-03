"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/seller-dashboard/DataTable";
import { SaleStatusBadge } from "@/components/seller-dashboard/SaleStatusBadge";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { orderCustomerLabel, type SellerOrderRow } from "@/types/seller-order";

function formatOrderDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function buildColumns(onRowClick: (id: string) => void): ColumnDef<SellerOrderRow, unknown>[] {
  return [
    {
      id: "id",
      accessorKey: "id",
      header: "Pedido",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onRowClick(row.original.id)}
          className="font-mono text-sm text-luxury-gold hover:underline"
        >
          #{row.original.id.slice(0, 8)}
        </button>
      ),
    },
    {
      id: "customer",
      accessorFn: (row) => orderCustomerLabel(row),
      header: "Cliente",
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SaleStatusBadge status={row.original.status} />,
    },
    {
      id: "payment",
      accessorKey: "payment_method",
      header: "Pagamento",
      cell: ({ row }) => (
        <span className="text-xs uppercase text-luxury-mist">
          {row.original.payment_method ?? "—"}
        </span>
      ),
    },
    {
      id: "total_cents",
      accessorKey: "total_cents",
      header: "Valor",
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{formatShopPrice(row.original.total_cents)}</span>
      ),
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-luxury-mist">{formatOrderDate(row.original.created_at)}</span>
      ),
    },
  ];
}

type Props = {
  orders: SellerOrderRow[];
  onSelectOrder: (orderId: string) => void;
};

export function OrdersDataTable({ orders, onSelectOrder }: Props) {
  return (
    <DataTable
      data={orders}
      columns={buildColumns(onSelectOrder)}
      emptyMessage="Nenhum pedido encontrado."
    />
  );
}
