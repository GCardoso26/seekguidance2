"use client";

import { useQuery } from "@tanstack/react-query";
import type { PdvProduct } from "@/types/pdv";

async function fetchPdvProducts(storeId: string, q: string): Promise<PdvProduct[]> {
  const res = await fetch(
    `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv?q=${encodeURIComponent(q)}`,
  );
  if (res.status === 401) throw new Error("login_required");
  if (res.status === 403) throw new Error("plan_forbidden");
  if (!res.ok) throw new Error("search_failed");
  const data = (await res.json()) as { products?: Record<string, unknown>[] };
  return (data.products ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Produto"),
    price_cents: Number(row.price_cents ?? 0),
    stock: Number(row.stock ?? 0),
    sku: row.sku != null ? String(row.sku) : null,
    category: row.category != null ? String(row.category) : null,
    images: (row.images as string[] | undefined) ?? null,
  }));
}

type Options = {
  storeId: string | null;
  q: string;
  enabled?: boolean;
};

export function usePdvSearch({ storeId, q, enabled = true }: Options) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ["pdv-search", storeId, trimmed],
    queryFn: () => fetchPdvProducts(storeId!, trimmed),
    enabled: Boolean(storeId) && trimmed.length >= 1 && enabled,
    staleTime: 30_000,
  });
}

/** Busca pontual (barcode) sem hook — para onScan. */
export async function lookupPdvProduct(storeId: string, code: string): Promise<PdvProduct | null> {
  const products = await fetchPdvProducts(storeId, code.trim());
  const exact = products.find(
    (p) => p.sku?.toLowerCase() === code.trim().toLowerCase() || p.id === code.trim(),
  );
  return exact ?? products[0] ?? null;
}
