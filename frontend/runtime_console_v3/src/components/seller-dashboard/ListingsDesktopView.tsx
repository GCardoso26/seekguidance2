"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import { LISTING_STATUS_LABEL, type SellerListingRow } from "@/types/seller-listing";
import { DataTable } from "./DataTable";

function formatListingDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function buildListingColumns(onDeactivate: (id: string) => void): ColumnDef<SellerListingRow, unknown>[] {
  return [
    {
      id: "cardName",
      accessorKey: "cardName",
      header: "Nome",
      cell: ({ row }) => (
        <Link
          href={`/loja/cartas/${row.original.cardId}`}
          className="font-medium hover:text-luxury-gold hover:underline"
        >
          {row.original.cardName || "Carta"}
        </Link>
      ),
    },
    {
      id: "price",
      accessorKey: "price",
      header: "Preço",
      cell: ({ row }) => (
        <span className="font-semibold text-luxury-gold">
          {formatCurrency(row.original.price, row.original.currency)}
        </span>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) => (
        <span className="text-luxury-mist">{formatListingDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status ?? "active",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status ?? "active";
        return (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-luxury-mist">
            {LISTING_STATUS_LABEL[status] ?? status}
          </span>
        );
      },
    },
    {
      id: "details",
      header: "Detalhes",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ConditionBadge condition={row.original.condition as CardCondition} size="sm" />
          <span className="text-xs text-luxury-mist">× {row.original.quantity}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild className="border-white/20">
            <Link href={`/vendedor/painel/listagens/${row.original.id}`}>Editar</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeactivate(row.original.id)}>
            Desativar
          </Button>
        </div>
      ),
    },
  ];
}

type Props = {
  listings: SellerListingRow[];
  onDeactivate: (id: string) => void;
};

export function ListingsDesktopView({ listings, onDeactivate }: Props) {
  return (
    <DataTable
      data={listings}
      columns={buildListingColumns(onDeactivate)}
      testId="seller-listings-table"
    />
  );
}
