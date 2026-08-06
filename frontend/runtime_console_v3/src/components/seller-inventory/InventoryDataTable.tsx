"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/seller-dashboard/DataTable";
import { OpsTruncatedText } from "@/components/seller-dashboard/OpsTruncatedText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/async-state";
import type { InventoryItem, InventoryKind } from "./types";
import { INVENTORY_LANGUAGES } from "./types";
import type { OpsColumnMeta } from "@/lib/ops-table";

const col = createColumnHelper<InventoryItem>();

type UndoEntry = {
  item: InventoryItem;
  mode: "set";
  quantity: number;
  price_cents: number;
  language?: string;
};

type Props = {
  items: InventoryItem[];
  kind: InventoryKind;
  queryKey: unknown[];
  highlight?: string;
  fullView?: boolean;
};

function highlightTitle(title: string, q?: string) {
  if (!q?.trim()) return title;
  const idx = title.toLowerCase().indexOf(q.trim().toLowerCase());
  if (idx < 0) return title;
  const end = idx + q.trim().length;
  return (
    <>
      {title.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">{title.slice(idx, end)}</mark>
      {title.slice(end)}
    </>
  );
}

export function InventoryDataTable({ items, kind, queryKey, highlight, fullView }: Props) {
  const qc = useQueryClient();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [error, setError] = useState<string | null>(null);
  const undoStack = useRef<UndoEntry[]>([]);

  const adjust = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/seller/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Falha"));
      return payload;
    },
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ["seller-inventory"] });
      void qc.invalidateQueries({ queryKey: ["seller-inventory-dashboard"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const bulk = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/seller/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Falha no lote"));
      return payload;
    },
    onSuccess: () => {
      setError(null);
      setRowSelection({});
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ["seller-inventory-dashboard"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const selectedItems = useMemo(
    () => items.filter((i) => rowSelection[i.id]),
    [items, rowSelection],
  );

  // createColumnHelper infere TValue por coluna; o cast unifica para DataTable.
  const columns = useMemo(
    () =>
      [
        col.display({
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
        }),
        col.accessor("title", {
          header: "Item",
          meta: { priority: "primary", minWidthClass: "min-w-[12rem]" } satisfies OpsColumnMeta,
          cell: ({ row }) => {
            const subtitle = [
              row.original.source,
              row.original.set_code || row.original.category,
              row.original.ink,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <div className="flex min-w-0 max-w-[16rem] items-center gap-2 sm:max-w-[20rem]">
                {row.original.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.original.image_url}
                    alt=""
                    className="h-10 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-8 shrink-0 rounded bg-muted" />
                )}
                <OpsTruncatedText
                  text={row.original.title}
                  subtitle={subtitle || undefined}
                  className="max-w-none flex-1"
                >
                  {highlightTitle(row.original.title, highlight)}
                </OpsTruncatedText>
              </div>
            );
          },
        }),
        col.accessor("quantity", {
          header: "Estoque",
          meta: { priority: "primary" } satisfies OpsColumnMeta,
          cell: ({ row }) => (
            <InlineQty
              item={row.original}
              kind={kind}
              onSave={(qty, priceCents, language) => {
                undoStack.current.push({
                  item: row.original,
                  mode: "set",
                  quantity: row.original.quantity,
                  price_cents: row.original.price_cents,
                  language: row.original.language,
                });
                adjust.mutate({
                  kind,
                  mode: "set",
                  quantity: qty,
                  price_cents: priceCents,
                  language,
                  listing_id: row.original.listing_id,
                  product_id: row.original.product_id,
                  card_id: row.original.card_id,
                  title: row.original.title,
                  category: row.original.category,
                });
              }}
            />
          ),
        }),
        col.accessor("language", {
          header: "Idioma",
          meta: { priority: "secondary" } satisfies OpsColumnMeta,
          cell: ({ row }) => (
            <LanguageSelect
              value={row.original.language || "pt"}
              disabled={adjust.isPending}
              onChange={(language) => {
                undoStack.current.push({
                  item: row.original,
                  mode: "set",
                  quantity: row.original.quantity,
                  price_cents: row.original.price_cents,
                  language: row.original.language,
                });
                adjust.mutate({
                  kind,
                  mode: "set",
                  quantity: row.original.quantity,
                  price_cents: row.original.price_cents,
                  language,
                  listing_id: row.original.listing_id,
                  product_id: row.original.product_id,
                  card_id: row.original.card_id,
                  title: row.original.title,
                  category: row.original.category,
                });
              }}
            />
          ),
        }),
        col.accessor("price_cents", {
          header: "Preço",
          meta: { priority: "primary" } satisfies OpsColumnMeta,
          cell: ({ getValue }) =>
            (Number(getValue()) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
        }),
        col.accessor((r) => r.health?.score ?? r.health_score ?? 0, {
          id: "health",
          header: "Saúde",
          meta: { priority: "secondary" } satisfies OpsColumnMeta,
          cell: ({ getValue, row }) => {
            const score = Number(getValue());
            const band = row.original.health?.band ?? "warn";
            const tone =
              band === "healthy"
                ? "text-success"
                : band === "critical"
                  ? "text-danger"
                  : "text-warning";
            return <span className={tone}>{score}</span>;
          },
        }),
        col.accessor("status", {
          header: "Status",
          meta: { priority: "tertiary" } satisfies OpsColumnMeta,
          cell: ({ getValue }) => String(getValue() || "active"),
        }),
        col.accessor("sold_qty", {
          header: "Vendidos",
          meta: { priority: "tertiary" } satisfies OpsColumnMeta,
          cell: ({ getValue }) => (getValue() != null ? String(getValue()) : "—"),
        }),
      ] as ColumnDef<InventoryItem>[],
    [adjust, highlight, kind],
  );

  function undoLast() {
    const last = undoStack.current.pop();
    if (!last) return;
    adjust.mutate({
      kind,
      mode: "set",
      quantity: last.quantity,
      price_cents: last.price_cents,
      language: last.language,
      listing_id: last.item.listing_id,
      product_id: last.item.product_id,
      card_id: last.item.card_id,
      title: last.item.title,
      category: last.item.category,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!selectedItems.length || bulk.isPending}
          onClick={() =>
            bulk.mutate({
              action: "publish",
              items: selectedItems,
            })
          }
        >
          Publicar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!selectedItems.length || bulk.isPending}
          onClick={() =>
            bulk.mutate({
              action: "archive",
              items: selectedItems,
            })
          }
        >
          Arquivar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!selectedItems.length || bulk.isPending}
          onClick={() => {
            const qty = Number(window.prompt("Somar quantidade a cada item selecionado", "1"));
            if (!Number.isFinite(qty) || qty <= 0) return;
            bulk.mutate({ action: "adjust_add", items: selectedItems, quantity: qty });
          }}
        >
          Bulk somar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={undoLast}>
          Undo
        </Button>
      </div>
      {error ? <InlineAlert message={error} tone="error" /> : null}
      <div className={fullView ? "max-h-[70vh] overflow-auto" : "max-h-[560px] overflow-auto"}>
        <DataTable
          data={items}
          columns={columns}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => row.id}
          stickyHeader
          emptyMessage="Nenhum item encontrado."
          testId="inventory-data-table"
        />
      </div>
    </div>
  );
}

function LanguageSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      value={value}
      disabled={disabled}
      aria-label="Idioma da carta"
      onChange={(e) => onChange(e.target.value)}
    >
      {INVENTORY_LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}

function InlineQty({
  item,
  kind,
  onSave,
}: {
  item: InventoryItem;
  kind: InventoryKind;
  onSave: (qty: number, priceCents: number, language: string) => void;
}) {
  const [qty, setQty] = useState(String(item.quantity));
  const [price, setPrice] = useState(((item.price_cents || 0) / 100).toFixed(2));

  return (
    <div className="flex items-center gap-1" data-testid={`inventory-qty-row-${item.id}`}>
      <Input
        className="h-8 w-16"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        data-testid={`inventory-qty-input-${item.id}`}
      />
      <Input
        className="h-8 w-20"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        data-testid={`inventory-price-input-${item.id}`}
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        data-testid={`inventory-qty-save-${item.id}`}
        onClick={() => {
          const q = Number.parseInt(qty, 10);
          const p = Math.round(Number(price.replace(",", ".")) * 100);
          if (!Number.isFinite(q) || q < 0 || !Number.isFinite(p)) return;
          onSave(q, p, item.language || "pt");
        }}
      >
        OK
      </Button>
      <span className="sr-only">{kind}</span>
    </div>
  );
}
