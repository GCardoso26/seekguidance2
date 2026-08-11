"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  buildMarketplaceProductsQuery,
  type MarketplaceProductFilters,
} from "@/lib/marketplace-filters";
import type { ShopProduct } from "@/lib/marketplace-shop";

export interface MarketplaceProductsResponse {
  products: ShopProduct[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

async function fetchMarketplaceProductsPage(
  filters: MarketplaceProductFilters,
  page: number,
): Promise<MarketplaceProductsResponse> {
  const params = buildMarketplaceProductsQuery({ ...filters, page });
  const res = await fetch(`/api/marketplace/products?${params.toString()}`);
  if (!res.ok) throw new Error("Falha ao carregar produtos");
  const data = (await res.json()) as MarketplaceProductsResponse;
  return {
    products: data.products ?? [],
    page: data.page ?? page,
    limit: data.limit ?? 24,
    total: data.total ?? 0,
    hasMore: Boolean(data.hasMore),
  };
}

export function useMarketplaceProductsInfinite(filters: MarketplaceProductFilters) {
  return useInfiniteQuery({
    queryKey: ["marketplace", "products", filters],
    queryFn: ({ pageParam }) => fetchMarketplaceProductsPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 120_000,
  });
}

export interface MarketplaceStoreOption {
  id: string;
  name: string;
  slug: string;
}

export function useMarketplaceStores() {
  return useQuery({
    queryKey: ["marketplace", "stores"],
    queryFn: async (): Promise<MarketplaceStoreOption[]> => {
      const res = await fetch("/api/featured-shops");
      if (!res.ok) return [];
      const data = (await res.json()) as {
        shops?: Array<{
          id?: string;
          shop_name?: string;
          slug?: string;
          store_slug?: string;
        }>;
      };
      const seen = new Set<string>();
      return (data.shops ?? [])
        .map((s) => ({
          id: String(s.id ?? ""),
          name: String(s.shop_name ?? "Loja"),
          slug: String(s.slug ?? s.store_slug ?? ""),
        }))
        .filter((s) => {
          if (!s.id || seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
    },
    staleTime: 300_000,
  });
}
