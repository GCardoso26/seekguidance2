"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export interface MasterCatalogSearchItem {
  product_id: string;
  title_pt: string;
  category: string;
  subcategory?: string;
  product_type?: string;
  game: string | null;
  sku: string | null;
  variant_id: string;
  variant_name: string;
  image_url: string | null;
}

export function useMasterProductSearch(filters: { q?: string; category?: string; game?: string }) {
  return useQuery({
    queryKey: ["master-product-search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category) params.set("category", filters.category);
      if (filters.game) params.set("game", filters.game);
      const res = await fetch(`/api/product-catalog/search?${params.toString()}`);
      if (!res.ok) throw new Error("search_failed");
      return res.json() as Promise<{ items: MasterCatalogSearchItem[] }>;
    },
  });
}

export function usePublishMasterListing() {
  return useMutation({
    mutationFn: async (body: {
      variant_id: string;
      price_cents: number;
      stock: number;
      condition: string;
    }) => {
      const res = await fetch("/api/product-catalog/seller/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "publish_failed");
      }
      return res.json();
    },
  });
}
