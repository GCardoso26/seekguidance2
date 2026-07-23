"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PdvLocalProduct, PdvLocalReport } from "@/types/pdv";

type ListFilters = {
  category?: string;
  active?: boolean | null;
  low_stock?: boolean;
};

async function fetchLocalProducts(storeId: string, filters: ListFilters): Promise<PdvLocalProduct[]> {
  const qs = new URLSearchParams();
  if (filters.category) qs.set("category", filters.category);
  if (filters.active != null) qs.set("active", String(filters.active));
  if (filters.low_stock) qs.set("low_stock", "true");
  const q = qs.toString();
  const res = await fetch(
    `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products${q ? `?${q}` : ""}`,
  );
  if (!res.ok) throw new Error("list_failed");
  const data = (await res.json()) as { products?: PdvLocalProduct[] };
  return data.products ?? [];
}

async function fetchLocalReport(storeId: string): Promise<PdvLocalReport> {
  const res = await fetch(
    `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products/reports`,
  );
  if (!res.ok) throw new Error("report_failed");
  const data = (await res.json()) as { report?: PdvLocalReport };
  if (!data.report) throw new Error("report_missing");
  return data.report;
}

export function usePdvLocalProducts(storeId: string | null, filters: ListFilters) {
  return useQuery({
    queryKey: ["pdv-local-products", storeId, filters],
    queryFn: () => fetchLocalProducts(storeId!, filters),
    enabled: Boolean(storeId),
  });
}

export function usePdvLocalReport(storeId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["pdv-local-report", storeId],
    queryFn: () => fetchLocalReport(storeId!),
    enabled: Boolean(storeId) && enabled,
  });
}

export function useDeletePdvLocalProduct(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("delete_failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pdv-local-products"] });
      void qc.invalidateQueries({ queryKey: ["pdv-local-report"] });
      void qc.invalidateQueries({ queryKey: ["pdv-search"] });
    },
  });
}
