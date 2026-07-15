"use client";

import type { CatalogSetOption, SearchFilters } from "@/types/search";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";

type Props = {
  filters: SearchFilters;
  onChange: (updates: Partial<SearchFilters>) => void;
  onClear: () => void;
  availableSets: CatalogSetOption[];
  className?: string;
  lockGame?: boolean;
};

/**
 * Sidebar de filtros para listagem de cartas (Epic 22 / CardTrader).
 * Encapsula SearchFiltersPanel com layout sticky à esquerda.
 */
export function ProductFiltersSidebar({
  filters,
  onChange,
  onClear,
  availableSets,
  className,
  lockGame = false,
}: Props) {
  return (
    <aside
      className={className ?? "w-full shrink-0 lg:sticky lg:top-24 lg:w-64 lg:self-start"}
      aria-label="Filtros de busca"
    >
      <SearchFiltersPanel
        filters={filters}
        onChange={onChange}
        onClear={onClear}
        availableSets={availableSets}
        lockGame={lockGame}
      />
    </aside>
  );
}
