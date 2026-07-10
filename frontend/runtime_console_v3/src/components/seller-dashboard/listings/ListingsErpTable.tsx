"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { formatCurrency } from "@/lib/format-currency";
import {
  orderedVisibleColumns,
  type ListingsColumnId,
  type ListingsErpPreferences,
} from "@/lib/seller-listings-erp-preferences";
import type { TableDensity } from "@/lib/seller-workspace-preferences";
import type { SellerListingRow } from "@/types/seller-listing";
import { DataTable } from "../DataTable";
import { listingStatusLabel } from "./ListingsToolbar";
import { duplicateListing } from "@/lib/seller-bulk-listings";

function formatListingDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function InlineNumberCell({
  value: initial,
  onSave,
  format,
}: {
  value: number;
  onSave: (n: number) => Promise<void>;
  format?: (n: number) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(initial));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="tabular-nums hover:text-primary hover:underline"
        onClick={() => setEditing(true)}
      >
        {format ? format(initial) : initial}
      </button>
    );
  }

  return (
    <input
      type="number"
      step={format ? "0.01" : "1"}
      min="0"
      className="w-20 rounded border border-primary/40 bg-muted px-2 py-1 text-sm"
      value={value}
      autoFocus
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={async () => {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          setEditing(false);
          setValue(String(initial));
          return;
        }
        setSaving(true);
        try {
          await onSave(n);
          toast.success("Atualizado");
        } catch {
          toast.error("Falha ao salvar");
          setValue(String(initial));
        } finally {
          setSaving(false);
          setEditing(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setValue(String(initial));
          setEditing(false);
        }
      }}
    />
  );
}

type Props = {
  listings: SellerListingRow[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (next: RowSelectionState) => void;
  onRefresh: () => void;
  columnPrefs: ListingsErpPreferences;
  density?: TableDensity;
};

const COLUMN_BUILDERS: Record<
  ListingsColumnId,
  (ctx: {
    patchListing: (id: string, body: Record<string, unknown>) => Promise<void>;
    onRefresh: () => void;
  }) => ColumnDef<SellerListingRow, unknown>
> = {
  select: () => ({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
  }),
  image: () => ({
    id: "image",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const src = row.original.images?.[0];
      return src ? (
        <div className="relative h-10 w-7 overflow-hidden rounded">
          <Image src={src} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="h-10 w-7 rounded bg-muted" />
      );
    },
  }),
  cardName: () => ({
    id: "cardName",
    accessorKey: "cardName",
    header: "Carta",
    cell: ({ row }) => (
      <div>
        <Link
          href={`/vendedor/painel/listagens/${row.original.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {row.original.cardName || "Carta"}
        </Link>
        {row.original.setName && (
          <p className="text-xs text-muted-foreground">{row.original.setName}</p>
        )}
      </div>
    ),
  }),
  language: () => ({
    id: "language",
    accessorKey: "language",
    header: "Idioma",
    cell: ({ row }) => <span className="text-xs uppercase">{row.original.language}</span>,
  }),
  foil: () => ({
    id: "foil",
    accessorFn: (r) => (r.foil ? 1 : 0),
    header: "Foil",
    cell: ({ row }) => (row.original.foil ? "Sim" : "—"),
  }),
  condition: () => ({
    id: "condition",
    header: "Condição",
    cell: ({ row }) => (
      <ConditionBadge condition={row.original.condition as CardCondition} size="sm" />
    ),
  }),
  price: ({ patchListing }) => ({
    id: "price",
    accessorKey: "price",
    header: "Preço",
    cell: ({ row }) => (
      <InlineNumberCell
        value={row.original.price}
        format={(n) => formatCurrency(n, row.original.currency)}
        onSave={(n) => patchListing(row.original.id, { price: n })}
      />
    ),
  }),
  quantity: ({ patchListing }) => ({
    id: "quantity",
    accessorKey: "quantity",
    header: "Qtd",
    cell: ({ row }) => (
      <InlineNumberCell
        value={row.original.quantity}
        format={(n) => `×${n}`}
        onSave={(n) => patchListing(row.original.id, { quantity: Math.floor(n) })}
      />
    ),
  }),
  status: () => ({
    id: "status",
    accessorFn: (r) => r.status ?? "active",
    header: "Status",
    cell: ({ row }) => (
      <span className="rounded-full border border-border px-2 py-0.5 text-xs">
        {listingStatusLabel(row.original.status)}
      </span>
    ),
  }),
  updated: () => ({
    id: "updated",
    accessorKey: "createdAt",
    header: "Atualizado",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatListingDate(row.original.createdAt)}</span>
    ),
  }),
  actions: ({ onRefresh }) => ({
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/vendedor/painel/listagens/${row.original.id}`}
          className="text-xs text-primary hover:underline"
        >
          Editar
        </Link>
        <button
          type="button"
          title="Duplicar"
          className="text-muted-foreground hover:text-primary"
          onClick={async () => {
            const result = await duplicateListing(row.original);
            if (result) {
              toast.success("Anúncio duplicado");
              onRefresh();
            } else toast.error("Falha ao duplicar");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
  }),
};

export function ListingsErpTable({
  listings,
  rowSelection,
  onRowSelectionChange,
  onRefresh,
  columnPrefs,
  density = "comfortable",
}: Props) {
  const patchListing = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/seller/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("patch_failed");
      onRefresh();
    },
    [onRefresh],
  );

  const ctx = useMemo(
    () => ({ patchListing, onRefresh }),
    [patchListing, onRefresh],
  );

  const columns = useMemo(() => {
    const ids = orderedVisibleColumns(columnPrefs);
    return ids.map((id) => COLUMN_BUILDERS[id](ctx));
  }, [columnPrefs, ctx]);

  return (
    <DataTable
      data={listings}
      columns={columns}
      testId="seller-listings-erp-table"
      enableRowSelection
      rowSelection={rowSelection}
      onRowSelectionChange={(updater) => {
        const next = typeof updater === "function" ? updater(rowSelection) : updater;
        onRowSelectionChange(next);
      }}
      getRowId={(row) => row.id}
      stickyHeader
      density={density}
    />
  );
}
