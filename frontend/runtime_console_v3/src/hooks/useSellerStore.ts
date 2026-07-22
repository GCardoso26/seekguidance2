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
  const { user, loading: authLoading } = useJudgeAuth();
  const storesQuery = useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      const res = await fetch("/api/stores/mine");
      if (res.status === 401) return [] as SellerStore[];
      if (!res.ok) return [] as SellerStore[];
      return res.json() as Promise<SellerStore[]>;
    },
    enabled: Boolean(user) && !authLoading,
    staleTime: 30_000,
    retry: false,
  });

  const stores = storesQuery.data ?? [];
  const fallbackStore = stores[0] ?? null;

  const dashboardQuery = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/seller/dashboard");
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error("dashboard_failed");
      return res.json();
    },
    enabled: Boolean(fallbackStore?.id) && Boolean(user) && !authLoading,
    staleTime: 30_000,
    refetchInterval: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "unauthorized") return false;
      return failureCount < 2;
    },
  });

  const dashboardStore = dashboardQuery.data?.store as Record<string, unknown> | undefined;
  const dashboardStoreId = dashboardStore?.id ? String(dashboardStore.id) : null;
  // Preferir a loja do dashboard (mesma regra do backend) para PIX/Stripe não “sumirem”
  const store =
    (dashboardStoreId ? stores.find((s) => s.id === dashboardStoreId) : undefined) ??
    fallbackStore;
  const storeId = store?.id ?? dashboardStoreId ?? null;

  const plan = String(dashboardStore?.subscription_plan ?? "free");

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
