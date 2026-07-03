"use client";

import { useQuery } from "@tanstack/react-query";
import type { HeaderNotificationsResponse } from "@/lib/seller-global-search-mock";

const REFETCH_MS = 30_000;

export function useHeaderNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "header"],
    queryFn: async () => {
      const res = await fetch("/api/seller/notifications/header", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<HeaderNotificationsResponse>;
    },
    enabled,
    refetchInterval: REFETCH_MS,
  });
}
