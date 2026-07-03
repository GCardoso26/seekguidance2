"use client";

import { useQuery } from "@tanstack/react-query";

export type SellerCustomerRow = {
  customer_id: string;
  display_name?: string | null;
  email?: string | null;
  handle?: string | null;
  city?: string | null;
  total_spent_cents: number;
  order_count: number;
  last_order_at?: string | null;
  segment?: string;
};

export function useSellerCustomers(search?: string, page = 1) {
  return useQuery({
    queryKey: ["seller-customers", search ?? "", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search?.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/seller/customers?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ customers: SellerCustomerRow[]; total: number }>;
    },
  });
}

export function useCustomerDetail(customerId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["seller-customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/seller/customers/${encodeURIComponent(customerId!)}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(customerId && enabled),
  });
}

export function useCustomerGamification(customerId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["seller-customer-gamification", customerId],
    queryFn: async () => {
      const res = await fetch(
        `/api/seller/customers/${encodeURIComponent(customerId!)}/gamification`,
      );
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
    enabled: Boolean(customerId && enabled),
  });
}
