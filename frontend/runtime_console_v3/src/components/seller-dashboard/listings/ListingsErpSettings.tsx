"use client";

import { useCallback, useState } from "react";
import { Columns3, Download, Save, Upload } from "lucide-react";
import Link from "next/link";
import type { ListingsFilterState } from "./ListingsToolbar";
import {
  LISTINGS_COLUMN_IDS,
  LISTINGS_COLUMN_LABELS,
  loadListingsErpPreferences,
  saveListingsErpPreferences,
  type ListingsColumnId,
  type ListingsErpPreferences,
} from "@/lib/seller-listings-erp-preferences";
import { downloadCsv, exportListingsCsv } from "@/lib/seller-bulk-listings";
import type { SellerListingRow } from "@/types/seller-listing";

type Props = {
  filters: ListingsFilterState;
  listings: SellerListingRow[];
  onPreferencesChange: (prefs: ListingsErpPreferences) => void;
  prefs: ListingsErpPreferences;
};

export function ListingsErpSettings({ filters, listings, onPreferencesChange, prefs }: Props) {
  const [showColumns, setShowColumns] = useState(false);
  const [filterName, setFilterName] = useState("");

  const toggleColumn = useCallback(
    (id: ListingsColumnId) => {
      const visible = prefs.columnVisibility[id] !== false;
      const next = {
        ...prefs,
        columnVisibility: { ...prefs.columnVisibility, [id]: !visible },
      };
      saveListingsErpPreferences(next);
      onPreferencesChange(next);
    },
    [prefs, onPreferencesChange],
  );

  const saveFilter = useCallback(() => {
    const name = filterName.trim();
    if (!name) return;
    const next = {
      ...prefs,
      savedFilters: [
        ...prefs.savedFilters,
        { id: `sf-${Date.now()}`, name, filters: { ...filters } },
      ],
    };
    saveListingsErpPreferences(next);
    onPreferencesChange(next);
    setFilterName("");
  }, [filterName, filters, prefs, onPreferencesChange]);

  const exportCsv = useCallback(() => {
    downloadCsv(
      `listagens-${new Date().toISOString().slice(0, 10)}.csv`,
      exportListingsCsv(listings),
    );
  }, [listings]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setShowColumns((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
      >
        <Columns3 className="h-3.5 w-3.5" />
        Colunas
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar CSV
      </button>
      <Link
        href="/vendedor/painel/estoque"
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
      >
        <Upload className="h-3.5 w-3.5" />
        Importar CSV
      </Link>
      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="Nome do filtro"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={saveFilter}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
        >
          <Save className="h-3.5 w-3.5" />
          Salvar filtro
        </button>
      </div>
      {prefs.savedFilters.length > 0 && (
        <select
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
          defaultValue=""
          onChange={(e) => {
            const sf = prefs.savedFilters.find((f) => f.id === e.target.value);
            if (sf) {
              window.dispatchEvent(
                new CustomEvent("listings-apply-saved-filter", { detail: sf.filters }),
              );
            }
            e.target.value = "";
          }}
          aria-label="Filtros salvos"
        >
          <option value="">Filtros salvos…</option>
          {prefs.savedFilters.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      )}
      {showColumns && (
        <div className="flex w-full flex-wrap gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
          {LISTINGS_COLUMN_IDS.filter((id) => id !== "select" && id !== "actions").map((id) => (
            <label key={id} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={prefs.columnVisibility[id] !== false}
                onChange={() => toggleColumn(id)}
              />
              {LISTINGS_COLUMN_LABELS[id]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function useListingsErpPreferencesState() {
  const [prefs, setPrefs] = useState<ListingsErpPreferences>(() => loadListingsErpPreferences());
  return { prefs, setPrefs };
}
