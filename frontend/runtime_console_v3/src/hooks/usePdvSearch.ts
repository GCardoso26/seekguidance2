"use client";

import { useQuery } from "@tanstack/react-query";
import type { PdvProduct, PdvProductSource } from "@/types/pdv";

function mapProduct(row: Record<string, unknown>): PdvProduct {
  const source = (row.source as PdvProductSource | undefined) ?? "official";
  const stockRaw = row.stock;
  return {
    id: String(row.id),
    name: String(row.name ?? "Produto"),
    price_cents: Number(row.price_cents ?? 0),
    stock: stockRaw == null ? null : Number(stockRaw),
    sku: row.sku != null ? String(row.sku) : null,
    barcode: row.barcode != null ? String(row.barcode) : null,
    category: row.category != null ? String(row.category) : null,
    images: (row.images as string[] | undefined) ?? null,
    source,
    local_product_id: row.local_product_id != null ? String(row.local_product_id) : source === "local" ? String(row.id) : null,
    cost_cents: row.cost_cents != null ? Number(row.cost_cents) : null,
  };
}

async function fetchPdvProducts(storeId: string, q: string): Promise<PdvProduct[]> {
  const res = await fetch(
    `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv?q=${encodeURIComponent(q)}`,
  );
  if (res.status === 401) throw new Error("login_required");
  if (res.status === 403) throw new Error("plan_forbidden");
  if (!res.ok) throw new Error("search_failed");
  const data = (await res.json()) as { products?: Record<string, unknown>[] };
  return (data.products ?? []).map(mapProduct);
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
  const needle = code.trim().toLowerCase();
  const exact = products.find(
    (p) =>
      p.sku?.toLowerCase() === needle ||
      p.barcode?.toLowerCase() === needle ||
      p.id === code.trim(),
  );
  return exact ?? products[0] ?? null;
}

export { mapProduct as mapPdvSearchProduct };
