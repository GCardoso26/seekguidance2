"use client";

import { useQuery } from "@tanstack/react-query";

export type RevenueRow = {
  date: string;
  orders: number;
  gross_cents: number;
  fees_cents: number;
  net_cents: number;
  status: string;
};

export function useFinanceRevenue(period: "7d" | "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: ["seller-finance-revenue", period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/seller/finance/revenue?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{
        rows: RevenueRow[];
        totals: { gross_cents: number; fees_cents: number; net_cents: number; orders: number };
        period: string;
      }>;
    },
  });
}

export function useFinancePayouts() {
  return useQuery({
    queryKey: ["seller-finance-payouts"],
    queryFn: async () => {
      const res = await fetch("/api/seller/finance/payouts");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
  });
}

export function useFinanceStripe() {
  return useQuery({
    queryKey: ["seller-finance-stripe"],
    queryFn: async () => {
      const res = await fetch("/api/seller/finance/stripe");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
  });
}

export function useFinancePix() {
  return useQuery({
    queryKey: ["seller-finance-pix"],
    queryFn: async () => {
      const res = await fetch("/api/seller/finance/pix");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json();
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["seller-notification-settings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/settings/notifications");
      if (!res.ok) throw new Error("fetch_failed");
      const data = await res.json();
      return (data.settings ?? data) as Record<string, string[]>;
    },
  });
}
