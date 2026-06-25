"use client";

import { useQuery } from "@tanstack/react-query";
import { MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
import { withPerformanceTracking } from "@/lib/performance";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { CatalogHealthReport } from "@/types/card";

const fetchCatalogHealth = withPerformanceTracking(async (): Promise<CatalogHealthReport> => {
  return fetchWithTimeout(
    async (signal) => {
      const res = await fetch("/api/catalog/health", { cache: "no-store", signal });
      if (!res.ok) {
        return MOCK_CATALOG_HEALTH;
      }
      const data = (await res.json()) as CatalogHealthReport & { error?: string; degraded?: boolean };
      if (data.error && !data.degraded) {
        return MOCK_CATALOG_HEALTH;
      }
      return {
        ...data,
        status: data.ready_for_marketplace ? "ready_for_marketplace" : "loading",
      };
    },
    { timeout: 12_000, retries: 1 },
  );
}, "Supabase: Catalog health");

export function useCatalogHealth() {
  return useQuery({
    queryKey: ["catalog", "health"],
    queryFn: fetchCatalogHealth,
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
    placeholderData: MOCK_CATALOG_HEALTH,
  });
}
