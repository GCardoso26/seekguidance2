"use client";

import { useQuery } from "@tanstack/react-query";
import type { SellerCouponsListResponse } from "@/lib/seller-coupons-bff";
import type { SellerCouponRow } from "@/types/seller-coupon";

export type { SellerCouponRow };

type ListOptions = {
  storeId: string | null | undefined;
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  enabled?: boolean;
};

function buildQueryString(page: number, limit: number, status?: string, type?: string) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) qs.set("status", status);
  if (type) qs.set("type", type);
  return qs.toString();
}

async function fetchSellerCoupons(
  storeId: string,
  page: number,
  limit: number,
  status?: string,
  type?: string,
): Promise<SellerCouponsListResponse> {
  const qs = buildQueryString(page, limit, status, type);
  const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons?${qs}`);
  if (res.status === 401) throw new Error("login_required");
  if (res.status === 403) throw new Error("plan_forbidden");
  if (!res.ok) throw new Error("fetch_failed");
  return res.json() as Promise<SellerCouponsListResponse>;
}

export function useSellerCoupons({
  storeId,
  page = 1,
  limit = 20,
  status = "",
  type = "",
  enabled = true,
}: ListOptions) {
  const statusNorm = status.trim();
  const typeNorm = type.trim();
  return useQuery({
    queryKey: ["seller-coupons", storeId, page, limit, statusNorm || "all", typeNorm || "all"],
    queryFn: () => fetchSellerCoupons(storeId!, page, limit, statusNorm || undefined, typeNorm || undefined),
    enabled: Boolean(storeId) && enabled,
    staleTime: 2 * 60 * 1000,
  });
}
