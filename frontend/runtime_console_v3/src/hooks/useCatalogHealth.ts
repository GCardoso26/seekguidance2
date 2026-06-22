"use client";

import { useQuery } from "@tanstack/react-query";
import { MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";
import type { CatalogHealthReport } from "@/types/card";

async function fetchCatalogHealth(): Promise<CatalogHealthReport> {
  const res = await fetch("/api/catalog/health", { cache: "no-store" });
  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      return MOCK_CATALOG_HEALTH;
    }
    throw new Error("catalog_health_unavailable");
  }
  const data = (await res.json()) as CatalogHealthReport & { error?: string };
  if (data.error) {
    if (process.env.NODE_ENV === "development") {
      return MOCK_CATALOG_HEALTH;
    }
    throw new Error(data.error);
  }
  return {
    ...data,
    status: data.ready_for_marketplace ? "ready_for_marketplace" : "loading",
  };
}

export function useCatalogHealth() {
  return useQuery({
    queryKey: ["catalog", "health"],
    queryFn: fetchCatalogHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
