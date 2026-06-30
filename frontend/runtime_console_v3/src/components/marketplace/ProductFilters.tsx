"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Filter, X } from "lucide-react";
import { useMemo } from "react";
import { ALL_GAME_IDS, GAME_TOKENS } from "@/lib/tcg-tokens";
import {
  MARKETPLACE_CONDITIONS,
  countActiveMarketplaceFilters,
  type MarketplaceProductFilters,
} from "@/lib/marketplace-filters";
import type { MarketplaceStoreOption } from "@/hooks/useMarketplaceProducts";
import type { GameId } from "@/types/card";

interface ProductFiltersProps {
  filters: MarketplaceProductFilters;
  onChange: (updates: Partial<MarketplaceProductFilters>) => void;
  onClear: () => void;
  stores: MarketplaceStoreOption[];
}

function FilterFields({ filters, onChange, onClear, stores }: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-luxury-frost">Preço (R$)</h4>
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
            className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm"
            aria-label="Preço mínimo"
          />
          <span className="text-luxury-mist">—</span>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Máx"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm"
            aria-label="Preço máximo"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-luxury-frost">Condição (singles)</h4>
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
              <span className="text-sm text-luxury-mist">{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-luxury-frost">Jogo</h4>
        <select
          value={filters.gameId ?? ""}
          onChange={(e) => onChange({ gameId: e.target.value || undefined, page: 1 })}
          className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm"
          aria-label="Filtrar por jogo"
        >
          <option value="">Todos</option>
          {ALL_GAME_IDS.map((id) => (
            <option key={id} value={id}>
              {GAME_TOKENS[id as GameId].name}
            </option>
          ))}
        </select>
      </div>

      {stores.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-luxury-frost">Loja</h4>
          <select
            value={filters.storeId ?? ""}
            onChange={(e) => onChange({ storeId: e.target.value || undefined, page: 1 })}
            className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm"
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
        />
        <span className="text-sm text-luxury-mist">Só produtos em estoque</span>
      </label>

      <button
        type="button"
        onClick={onClear}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 py-2 text-sm hover:bg-white/5"
      >
        <X className="h-4 w-4" />
        Limpar filtros
      </button>
    </div>
  );
}

export function ProductFilters(props: ProductFiltersProps) {
  const activeCount = useMemo(() => countActiveMarketplaceFilters(props.filters), [props.filters]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block" data-testid="marketplace-filters-desktop">
        <div className="sticky top-20 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-4 text-lg font-semibold text-luxury-frost">Filtros</h3>
          <FilterFields {...props} />
        </div>
      </aside>

      <div className="lg:hidden">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              data-testid="marketplace-filters-open"
              className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="rounded-full bg-luxury-gold px-1.5 text-xs text-luxury-onyx">{activeCount}</span>
              )}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Dialog.Content
              className="fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] overflow-y-auto border-r border-white/10 bg-luxury-onyx p-4 shadow-xl"
              data-testid="marketplace-filters-drawer"
            >
              <Dialog.Title className="mb-4 text-lg font-semibold text-luxury-frost">Filtros</Dialog.Title>
              <FilterFields {...props} />
              <Dialog.Close asChild>
                <button
                  type="button"
                  data-testid="marketplace-filters-apply"
                  className="mt-4 w-full rounded-md bg-luxury-gold py-2 text-sm font-semibold text-luxury-onyx"
                >
                  Aplicar
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
