"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  MarketplaceSellerProfile,
  SellerProductFilters,
  SellerProductsResponse,
} from "@/lib/seller-profile-query";
import { searchParamsFromSellerProductFilters } from "@/lib/seller-profile-filters";

export function useSellerProfile(username: string) {
  return useQuery({
    queryKey: ["seller-profile", username],
    queryFn: async (): Promise<MarketplaceSellerProfile> => {
      const res = await fetch(`/api/marketplace/sellers/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("seller_not_found");
      return res.json();
    },
    staleTime: 5 * 60_000,
    enabled: Boolean(username),
  });
}

export function useSellerProducts(username: string, filters: SellerProductFilters) {
  return useInfiniteQuery({
    queryKey: ["seller-products", username, filters],
    queryFn: async ({ pageParam }): Promise<SellerProductsResponse> => {
      const params = searchParamsFromSellerProductFilters(filters, pageParam);
      const res = await fetch(
        `/api/marketplace/sellers/${encodeURIComponent(username)}/products?${params}`,
      );
      if (!res.ok) throw new Error("products_fetch_failed");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const next = last.page + 1;
      return next <= Math.ceil(last.total / last.limit) ? next : undefined;
    },
    staleTime: 60_000,
    enabled: Boolean(username),
  });
}
