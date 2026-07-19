"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type SellerProduct = {
  id: string;
  name: string;
  category: string;
  price_cents: number;
  stock: number;
  sku?: string | null;
  is_active?: boolean;
  description?: string | null;
};

export function useSellerProducts(category?: string, search?: string, page = 1) {
  return useQuery({
    queryKey: ["seller-products", category ?? "", search ?? "", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (category) params.set("category", category);
      if (search?.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/seller/products?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ products: SellerProduct[]; total: number }>;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("create_failed");
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller-products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("update_failed");
      return res.json();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller-products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/seller/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete_failed");
      return res.json().catch(() => ({ ok: true }));
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller-products"] }),
  });
}
