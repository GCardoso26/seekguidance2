"use client";

import { useQuery } from "@tanstack/react-query";
import { normalizeStoreEvent, type StoreEventRow } from "@/types/store-event";

export function useSellerStoreEvents(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ["seller-store-events", storeId],
    queryFn: async (): Promise<StoreEventRow[]> => {
      const qs = new URLSearchParams({
        store_id: storeId!,
        owner: "1",
        limit: "50",
      });
      const res = await fetch(`/api/tournament-platform/events?${qs}`);
      if (res.status === 401) throw new Error("login_required");
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as { events?: Record<string, unknown>[] };
      return (data.events ?? []).map((e) => normalizeStoreEvent(e));
    },
    enabled: Boolean(storeId),
    staleTime: 60_000,
  });
}
