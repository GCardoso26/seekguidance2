"use client";

import { useCallback, useState } from "react";
import type { SellerListingRow } from "@/types/seller-listing";
import { LISTING_STATUS_LABEL } from "@/types/seller-listing";

export type ListingsFilterState = {
  search: string;
  status: string;
};

type Props = {
  onFilterChange: (next: ListingsFilterState) => void;
  selectedCount: number;
  onBulkPause: () => void;
  onBulkActivate: () => void;
  onBulkPriceAdjust: (percent: number) => void;
  onOpenPriceModal?: () => void;
  onOpenInventoryModal?: () => void;
  onBulkArchive?: () => void;
  onBulkDuplicate?: () => void;
  onDuplicateRow?: (id: string) => void;
  busy?: boolean;
  recentSearches?: string[];
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos status" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Pausados" },
  { value: "reserved", label: "Reservados" },
  { value: "sold", label: "Vendidos" },
];

export function ListingsToolbar({
  onFilterChange,
  selectedCount,
  onBulkPause,
  onBulkActivate,
  onBulkPriceAdjust,
  onOpenPriceModal,
  onOpenInventoryModal,
  onBulkArchive,
  onBulkDuplicate,
  busy,
  recentSearches = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const emit = useCallback(
    (next: Partial<ListingsFilterState>) => {
      const merged = { search, status, ...next };
      setSearch(merged.search);
      setStatus(merged.status);
      onFilterChange(merged);
    },
    [search, status, onFilterChange],
  );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3" data-testid="listings-toolbar">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar carta, expansão…"
          value={search}
          onChange={(e) => emit({ search: e.target.value })}
          list="listings-recent-searches"
          className="min-w-[200px] flex-1 surface-card rounded-lg px-3 py-2 text-sm"
          aria-label="Buscar listagens"
        />
        {recentSearches.length > 0 && (
          <datalist id="listings-recent-searches">
            {recentSearches.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
        <select
          value={status}
          onChange={(e) => emit({ status: e.target.value })}
          className="surface-card rounded-lg px-3 py-2 text-sm"
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{selectedCount} selecionado(s)</span>
          <button
            type="button"
            disabled={busy}
            onClick={onBulkActivate}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            Publicar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onBulkPause}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Pausar
          </button>
          {onBulkArchive && (
            <button
              type="button"
              disabled={busy}
              onClick={onBulkArchive}
              className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Arquivar
            </button>
          )}
          {onBulkDuplicate && (
            <button
              type="button"
              disabled={busy}
              onClick={onBulkDuplicate}
              className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Duplicar
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onBulkPriceAdjust(5)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            +5%
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onBulkPriceAdjust(-5)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            −5%
          </button>
          {onOpenPriceModal && (
            <button
              type="button"
              disabled={busy}
              onClick={onOpenPriceModal}
              className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Preço…
            </button>
          )}
          {onOpenInventoryModal && (
            <button
              type="button"
              disabled={busy}
              onClick={onOpenInventoryModal}
              className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Estoque…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Filtro fuzzy client-side sobre a página carregada. */
export function filterListingsClient(
  listings: SellerListingRow[],
  { search, status }: ListingsFilterState,
): SellerListingRow[] {
  let rows = listings;
  if (status) {
    rows = rows.filter((r) => (r.status ?? "active") === status);
  }
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const hay = `${r.cardName ?? ""} ${r.setName ?? ""} ${r.language ?? ""}`.toLowerCase();
    return hay.includes(q) || q.split(/\s+/).every((token) => hay.includes(token));
  });
}

export function listingStatusLabel(status?: string): string {
  return LISTING_STATUS_LABEL[status ?? "active"] ?? status ?? "—";
}
