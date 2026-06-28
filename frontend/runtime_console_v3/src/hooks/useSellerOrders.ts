"use client";

import { useQuery } from "@tanstack/react-query";
import { buildSellerOrdersQuery } from "@/lib/seller-orders-query";
import { normalizeSellerOrder, type SellerOrderRow } from "@/types/seller-order";

export type SellerOrdersResponse = {
  orders: SellerOrderRow[];
  total: number;
  page: number;
  limit: number;
};

type Options = {
  page?: number;
  limit?: number;
  status?: string;
  enabled?: boolean;
};

async function fetchSellerOrders(page: number, limit: number, status?: string): Promise<SellerOrdersResponse> {
  const qs = buildSellerOrdersQuery(page, limit, status);
  const res = await fetch(`/api/seller/orders?${qs}`);
  if (res.status === 401) throw new Error("login_required");
  if (!res.ok) throw new Error("fetch_failed");
  const payload = (await res.json()) as {
    orders?: Record<string, unknown>[];
    total?: number;
    page?: number;
    limit?: number;
  };
  return {
    orders: (payload.orders ?? []).map((row) => normalizeSellerOrder(row)),
    total: payload.total ?? payload.orders?.length ?? 0,
    page: payload.page ?? page,
    limit: payload.limit ?? limit,
  };
}

export function useSellerOrders({ page = 1, limit = 20, status = "", enabled = true }: Options = {}) {
  const statusFilter = status || undefined;
  return useQuery({
    queryKey: ["seller-orders", page, limit, statusFilter ?? "all"],
    queryFn: () => fetchSellerOrders(page, limit, statusFilter),
    enabled,
  });
}

/** Contagem de pedidos pendentes (status pending) para badge no header. */
export function useSellerPendingOrdersCount(enabled = true) {
  return useQuery({
    queryKey: ["seller-orders-pending-count"],
    queryFn: async () => {
      const data = await fetchSellerOrders(1, 1, "pending");
      return data.total;
    },
    enabled,
    staleTime: 60_000,
  });
}
