"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/marketplace-shop";
import { orderCustomerLabel, type SellerOrderRow } from "@/types/seller-order";
import { DataTable } from "./DataTable";
import { SaleStatusBadge } from "./SaleStatusBadge";

function formatOrderDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function buildOrderColumns(onView: (id: string) => string): ColumnDef<SellerOrderRow, unknown>[] {
  return [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <Link href={onView(row.original.id)} className="font-mono text-sm text-luxury-gold hover:underline">
          #{row.original.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      id: "customer",
      accessorFn: (row) => orderCustomerLabel(row),
      header: "Cliente",
      cell: ({ row }) => <span>{orderCustomerLabel(row.original)}</span>,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-luxury-mist">{formatOrderDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "total_cents",
      accessorKey: "total_cents",
      header: "Valor",
      cell: ({ row }) => (
        <span className="font-semibold text-luxury-gold">{formatShopPrice(row.original.total_cents)}</span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SaleStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild className="border-white/20">
            <Link href={onView(row.original.id)}>Ver</Link>
          </Button>
        </div>
      ),
    },
  ];
}

type Props = {
  orders: SellerOrderRow[];
};

export function OrdersDesktopView({ orders }: Props) {
  const orderHref = (id: string) => `/vendedor/painel/vendas/${id}`;
  return (
    <DataTable
      data={orders}
      columns={buildOrderColumns(orderHref)}
      testId="seller-orders-table"
      emptyMessage="Nenhum pedido nesta página."
    />
  );
}
