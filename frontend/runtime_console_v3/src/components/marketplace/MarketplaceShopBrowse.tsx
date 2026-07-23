"use client";

import { useCallback, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
  type MarketplaceProductFilters,
  type MarketplaceSort,
} from "@/lib/marketplace-filters";
import { useDebounce } from "@/hooks/useDebounce";
import { useMarketplaceProductsInfinite, useMarketplaceStores } from "@/hooks/useMarketplaceProducts";
import { addProductToCart } from "@/lib/marketplace-shop";
import { showToast } from "@/lib/toast";
import { SearchBarWithSyntax } from "@/components/search/SearchBarWithSyntax";

const ProductFilters = dynamic(
  () => import("@/components/marketplace/ProductFilters").then((m) => m.ProductFilters),
  { ssr: false, loading: () => <div className="hidden w-64 shrink-0 lg:block" /> },
);

const ProductGrid = dynamic(
  () => import("@/components/marketplace/ProductGrid").then((m) => m.ProductGrid),
  { ssr: false, loading: () => null },
);

function MarketplaceShopBrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<MarketplaceProductFilters>(() => filtersFromSearchParams(searchParams));
  const debouncedQ = useDebounce(filters.q ?? "", 300);

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
      // Must use /marketplace/produtos — /marketplace redirects to /loja and drops filter query (BUG-V5-005).
      router.replace(qs ? `/marketplace/produtos?${qs}` : "/marketplace/produtos", { scroll: false });
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
    syncURL(cleared);
  }, [syncURL]);

  async function handleAddToCart(productId: string) {
    const result = await addProductToCart(productId);
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      showToast("Produto adicionado ao carrinho", "success");
      window.location.href = "/marketplace/cart";
      return;
    }
    if (result.needsLogin) {
      showToast("Faça login para adicionar ao carrinho", "error");
      window.location.href = `/entrar?next=${encodeURIComponent("/marketplace")}`;
      return;
    }
    showToast(result.message, "error");
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SearchBarWithSyntax
        value={filters.q ?? ""}
        onChange={(v) => updateFilters({ q: v || undefined })}
        onSubmit={(v) => updateFilters({ q: v || undefined })}
        placeholder="Buscar pelo nome da carta, loja ou produto…"
        data-testid="marketplace-search"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <ProductFilters filters={filters} onChange={updateFilters} onClear={clearFilters} stores={stores} />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end">
            <select
              value={filters.sortBy ?? "relevance"}
              onChange={(e) => updateFilters({ sortBy: e.target.value as MarketplaceSort })}
              className="min-h-11 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
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
            onAddToCart={handleAddToCart}
            onClearFilters={clearFilters}
          />
        </div>
      </div>
    </div>
  );
}

export function MarketplaceShopBrowse() {
  return (
    <Suspense fallback={null}>
      <MarketplaceShopBrowseInner />
    </Suspense>
  );
}
