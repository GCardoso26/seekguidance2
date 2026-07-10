"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { FilterFields, type FilterFieldsProps } from "@/components/marketplace/product-filters/FilterFields";
import { countActiveMarketplaceFilters } from "@/lib/marketplace-filters";

const ProductFiltersDrawer = dynamic(
  () =>
    import("@/components/marketplace/product-filters/ProductFiltersDrawer").then(
      (m) => m.ProductFiltersDrawer,
    ),
  { ssr: false },
);

export function ProductFilters(props: FilterFieldsProps) {
  const activeCount = useMemo(() => countActiveMarketplaceFilters(props.filters), [props.filters]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block" data-testid="marketplace-filters-desktop">
        <div className="sticky top-20 surface-card p-4">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Filtros</h3>
          <FilterFields {...props} />
        </div>
      </aside>

      <div className="lg:hidden">
        <ProductFiltersDrawer {...props} activeCount={activeCount} />
      </div>
    </>
  );
}
