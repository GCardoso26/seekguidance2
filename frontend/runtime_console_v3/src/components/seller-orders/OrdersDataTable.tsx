"use client";

import type { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/seller-dashboard/DataTable";
import { SaleStatusBadge } from "@/components/seller-dashboard/SaleStatusBadge";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { orderCustomerLabel, type SellerOrderRow } from "@/types/seller-order";

function formatOrderDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function buildColumns(
  onRowClick: (id: string) => void,
  selectable: boolean,
): ColumnDef<SellerOrderRow, unknown>[] {
  const cols: ColumnDef<SellerOrderRow, unknown>[] = [];

  if (selectable) {
    cols.push({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Selecionar todos"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-border"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Selecionar pedido ${row.original.id.slice(0, 8)}`}
          checked={row.getIsSelected()}
          onClick={(e) => e.stopPropagation()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-border"
        />
      ),
      enableSorting: false,
    });
  }

  cols.push(
    {
      id: "id",
      accessorKey: "id",
      header: "Pedido",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onRowClick(row.original.id)}
          className="font-mono text-sm text-primary hover:underline"
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
        <span className="text-xs uppercase text-muted-foreground">
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
        <span className="text-muted-foreground">{formatOrderDate(row.original.created_at)}</span>
      ),
    },
  );

  return cols;
}

type Props = {
  orders: SellerOrderRow[];
  onSelectOrder: (orderId: string) => void;
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
};

export function OrdersDataTable({
  orders,
  onSelectOrder,
  selectable = false,
  rowSelection,
  onRowSelectionChange,
}: Props) {
  return (
    <DataTable
      data={orders}
      columns={buildColumns(onSelectOrder, selectable)}
      emptyMessage="Nenhum pedido encontrado."
      enableRowSelection={selectable}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      getRowId={(row) => row.id}
    />
  );
}
