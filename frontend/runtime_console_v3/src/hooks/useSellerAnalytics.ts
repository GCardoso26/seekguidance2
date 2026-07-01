"use client";

import { useQuery } from "@tanstack/react-query";
import type { SellerAnalyticsResponse } from "@/lib/seller-analytics-query";

export function useSellerAnalytics(username: string) {
  const enabled =
    Boolean(username) && process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS !== "false";

  return useQuery({
    queryKey: ["seller-analytics", username],
    queryFn: async (): Promise<SellerAnalyticsResponse> => {
      const res = await fetch(`/api/marketplace/sellers/${encodeURIComponent(username)}/analytics`);
      if (!res.ok) throw new Error("analytics_fetch_failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
    enabled,
  });
}
