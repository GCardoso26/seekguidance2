"use client";

import { useQuery } from "@tanstack/react-query";
import type { IntelligenceDashboard } from "@/types/seller-intelligence";

export function useSellerIntelligence(period: "7d" | "30d" | "90d" = "30d") {
  return useQuery({
    queryKey: ["seller-intelligence", period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/seller/intelligence?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<IntelligenceDashboard>;
    },
  });
}
