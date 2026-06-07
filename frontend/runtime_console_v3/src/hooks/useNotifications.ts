"use client";

import { useQuery } from "@tanstack/react-query";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/me", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30_000,
  });
}
