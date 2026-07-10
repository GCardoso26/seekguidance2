"use client";

import { X } from "lucide-react";
import { MARKETPLACE_CONDITIONS, type MarketplaceProductFilters } from "@/lib/marketplace-filters";
import { MARKETPLACE_GAME_OPTIONS } from "@/lib/marketplace-games";
import { MarketplaceFiltersAdvanced } from "@/components/marketplace/MarketplaceFiltersAdvanced";
import { getCategoriesForGame, categoryLabel, SHOP_CATEGORIES_FLAT } from "@/lib/tcg-product-categories";
import type { GameId } from "@/types/card";
import type { MarketplaceStoreOption } from "@/hooks/useMarketplaceProducts";

export interface FilterFieldsProps {
  filters: MarketplaceProductFilters;
  onChange: (updates: Partial<MarketplaceProductFilters>) => void;
  onClear: () => void;
  stores: MarketplaceStoreOption[];
}

export function FilterFields({ filters, onChange, onClear, stores }: FilterFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Preço (R$)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Mín"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-small focus-ring"
            aria-label="Preço mínimo"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Máx"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-small focus-ring"
            aria-label="Preço máximo"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Condição (singles)</h4>
        <div className="space-y-1">
          {MARKETPLACE_CONDITIONS.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filters.condition?.includes(c.value) ?? false}
                onChange={(e) => {
                  const current = filters.condition ?? [];
                  const next = e.target.checked
                    ? [...current, c.value]
                    : current.filter((v) => v !== c.value);
                  onChange({ condition: next.length ? next : undefined, page: 1 });
                }}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Jogo</h4>
        <select
          value={filters.gameId ?? ""}
          onChange={(e) => onChange({ gameId: e.target.value || undefined, page: 1 })}
          className="h-9 w-full rounded-lg border border-input bg-card px-3 text-small focus-ring"
          aria-label="Filtrar por jogo"
        >
          <option value="">Todos</option>
          {MARKETPLACE_GAME_OPTIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Categoria</h4>
        <select
          value={filters.category ?? ""}
          onChange={(e) => onChange({ category: e.target.value || undefined, page: 1 })}
          className="h-9 w-full rounded-lg border border-input bg-card px-3 text-small focus-ring"
          aria-label="Filtrar por categoria de produto"
        >
          <option value="">Todas</option>
          {(filters.gameId
            ? getCategoriesForGame(filters.gameId as GameId)
            : SHOP_CATEGORIES_FLAT.map((c) => ({ id: c.id, label: c.label, imageUrl: "" }))
          ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
        </select>
        {filters.category && (
          <p className="mt-1 text-xs text-muted-foreground">{categoryLabel(filters.category)}</p>
        )}
      </div>

      {stores.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">Loja</h4>
          <select
            value={filters.storeId ?? ""}
            onChange={(e) => onChange({ storeId: e.target.value || undefined, page: 1 })}
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-small focus-ring"
            aria-label="Filtrar por loja"
          >
            <option value="">Todas</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(filters.inStock)}
          onChange={(e) => onChange({ inStock: e.target.checked || undefined, page: 1 })}
          className="h-4 w-4"
          aria-label="Só produtos em estoque"
        />
        <span className="text-sm text-muted-foreground">Só produtos em estoque</span>
      </label>

      <MarketplaceFiltersAdvanced filters={filters} onChange={onChange} />

      <button
        type="button"
        onClick={onClear}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm hover:bg-muted/80"
      >
        <X className="h-4 w-4" />
        Limpar filtros
      </button>
    </div>
  );
}
