"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardOverviewResponse } from "@/types/seller-dashboard-overview";

export function useDashboardOverview(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/seller/dashboard/overview");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json() as Promise<DashboardOverviewResponse>;
    },
    enabled,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
