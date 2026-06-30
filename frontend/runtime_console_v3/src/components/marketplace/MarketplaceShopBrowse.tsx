"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  type MarketplaceProductFilters,
  type MarketplaceSort,
} from "@/lib/marketplace-filters";
import { useMarketplaceProductsInfinite, useMarketplaceStores } from "@/hooks/useMarketplaceProducts";

const ProductFilters = dynamic(
  () => import("@/components/marketplace/ProductFilters").then((m) => m.ProductFilters),
  { ssr: false, loading: () => <div className="hidden w-64 shrink-0 lg:block" /> },
);

interface MarketplaceShopBrowseProps {
  onAddToCart: (productId: string) => void;
}

function MarketplaceShopBrowseInner({ onAddToCart }: MarketplaceShopBrowseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<MarketplaceProductFilters>(() => filtersFromSearchParams(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q ?? "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q ?? ""), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const queryFilters = useMemo(
    () => ({ ...filters, q: debouncedQ || undefined }),
    [filters, debouncedQ],
  );

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useMarketplaceProductsInfinite(queryFilters);

  const { data: stores = [] } = useMarketplaceStores();

  const products = useMemo(() => data?.pages.flatMap((p) => p.products) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const syncURL = useCallback(
    (next: MarketplaceProductFilters) => {
      const params = searchParamsFromFilters({ ...next, page: undefined });
      const qs = params.toString();
      router.replace(qs ? `/marketplace?${qs}` : "/marketplace", { scroll: false });
    },
    [router],
  );

  const updateFilters = useCallback(
    (updates: Partial<MarketplaceProductFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...updates, page: 1 };
        syncURL(next);
        return next;
      });
    },
    [syncURL],
  );

  const clearFilters = useCallback(() => {
    const cleared: MarketplaceProductFilters = { sortBy: "relevance" };
    setFilters(cleared);
    setDebouncedQ("");
    syncURL(cleared);
  }, [syncURL]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Input
        type="search"
        value={filters.q ?? ""}
        onChange={(e) => updateFilters({ q: e.target.value || undefined })}
        placeholder="Buscar produtos…"
        className="h-11 border-white/10 bg-white/5"
        aria-label="Buscar produtos"
        data-testid="marketplace-search"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <ProductFilters filters={filters} onChange={updateFilters} onClear={clearFilters} stores={stores} />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end">
            <select
              value={filters.sortBy ?? "relevance"}
              onChange={(e) => updateFilters({ sortBy: e.target.value as MarketplaceSort })}
              className="min-h-11 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
              aria-label="Ordenar produtos"
              data-testid="marketplace-sort"
            >
              <option value="relevance">Relevância</option>
              <option value="price_asc">Preço: menor → maior</option>
              <option value="price_desc">Preço: maior → menor</option>
              <option value="newest">Mais recentes</option>
            </select>
          </div>

          <ProductGrid
            products={products}
            isLoading={isLoading}
            total={total}
            hasMore={Boolean(hasNextPage)}
            onLoadMore={() => fetchNextPage()}
            isFetchingMore={isFetchingNextPage}
            onAddToCart={onAddToCart}
            onClearFilters={clearFilters}
          />
        </div>
      </div>
    </div>
  );
}

export function MarketplaceShopBrowse(props: MarketplaceShopBrowseProps) {
  return (
    <Suspense fallback={<ProductGrid products={[]} isLoading />}>
      <MarketplaceShopBrowseInner {...props} />
    </Suspense>
  );
}
