"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  INVENTORY_SOURCES,
  LORCANA_INKS,
  type InventorySource,
  type SalesPeriod,
  type StockFilter,
} from "./types";

type Props = {
  source: InventorySource;
  onSourceChange: (s: InventorySource) => void;
  query: string;
  onQueryChange: (q: string) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (f: StockFilter) => void;
  period: SalesPeriod;
  onPeriodChange: (p: SalesPeriod) => void;
  onSearch: () => void;
  game?: string;
  ink?: string | null;
  onInkChange?: (ink: string | null) => void;
};

export function InventorySearchPanel({
  source,
  onSourceChange,
  query,
  onQueryChange,
  stockFilter,
  onStockFilterChange,
  period,
  onPeriodChange,
  onSearch,
  game,
  ink,
  onInkChange,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const isBestsellers =
    source === "bestsellers_marketplace" || source === "bestsellers_store";
  const activeHelp = INVENTORY_SOURCES.find((s) => s.id === source)?.help;
  const showInk = game === "lorcana" && onInkChange;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Busca</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setHelpOpen((v) => !v)}
        >
          <HelpCircle className="h-4 w-4" />
          Sobre esta busca
        </Button>
      </div>

      {helpOpen && activeHelp ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {activeHelp}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tipo de cadastro
        </legend>
        <div className="flex flex-wrap gap-2">
          {INVENTORY_SOURCES.map((s) => (
            <label
              key={s.id}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors",
                source === s.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/60",
              )}
            >
              <input
                type="radio"
                name="inventory-source"
                className="sr-only"
                checked={source === s.id}
                onChange={() => onSourceChange(s.id)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-muted-foreground">Produto / carta</label>
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
            placeholder="Nome, set ou SKU…"
            data-testid="search-card"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Filtro de estoque</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value as StockFilter)}
          >
            <option value="all">Todos</option>
            <option value="with_stock">Com estoque</option>
            <option value="without_stock">Sem estoque</option>
          </select>
        </div>
        {showInk ? (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ink (Lorcana)</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={ink ?? ""}
              onChange={(e) => onInkChange(e.target.value || null)}
            >
              <option value="">Todas</option>
              {LORCANA_INKS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        ) : isBestsellers ? (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Período</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as SalesPeriod)}
            >
              <option value="day">Diário</option>
              <option value="week">Semanal</option>
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
            </select>
          </div>
        ) : (
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={onSearch}>
              Buscar
            </Button>
          </div>
        )}
      </div>

      {showInk || isBestsellers ? (
        <div className="flex justify-end">
          <Button type="button" onClick={onSearch}>
            Buscar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
