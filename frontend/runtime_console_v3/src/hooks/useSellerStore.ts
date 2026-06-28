"use client";

import { useQuery } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export type SellerStore = {
  id: string;
  slug?: string;
  name?: string;
  owner_id?: string;
};

export function useSellerStore() {
  const { user } = useJudgeAuth();
  const storesQuery = useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      const res = await fetch("/api/stores/mine");
      if (!res.ok) return [] as SellerStore[];
      return res.json() as Promise<SellerStore[]>;
    },
    staleTime: 30_000,
  });

  const store = storesQuery.data?.[0] ?? null;
  const storeId = store?.id ?? null;

  const dashboardQuery = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/seller/dashboard");
      if (!res.ok) throw new Error("dashboard_failed");
      return res.json();
    },
    enabled: Boolean(storeId),
    staleTime: 30_000,
    refetchInterval: 5 * 60 * 1000,
  });

  const plan = String(
    (dashboardQuery.data?.store as Record<string, unknown> | undefined)?.subscription_plan ?? "free",
  );

  return {
    store,
    storeId,
    ownerId: store?.owner_id ?? user?.id ?? null,
    storeSlug: store?.slug ?? null,
    plan,
    isLoading: storesQuery.isLoading,
    hasStore: Boolean(storeId),
    dashboard: dashboardQuery.data,
    dashboardLoading: dashboardQuery.isLoading,
    refetchDashboard: dashboardQuery.refetch,
  };
}
