"use client";

import { useQuery } from "@tanstack/react-query";
import type { Store, StoresResponse } from "@/types/store";

export type StoresFilter = {
  city?: string;
  country?: string;
  verified?: boolean;
  search?: string;
};

export function useStores(filter?: StoresFilter) {
  return useQuery({
    queryKey: ["stores", filter],
    queryFn: async (): Promise<StoresResponse> => {
      const params = new URLSearchParams();
      if (filter?.city) params.set("city", filter.city);
      if (filter?.country) params.set("country", filter.country);
      if (filter?.verified) params.set("verified_only", "true");
      const res = await fetch(`/api/stores?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar lojas");
      const rows = (await res.json()) as Store[];
      const stores = filter?.search
        ? rows.filter(
            (s) =>
              s.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
              (s.city ?? "").toLowerCase().includes(filter.search!.toLowerCase()),
          )
        : rows;
      return { stores, total: stores.length };
    },
  });
}
